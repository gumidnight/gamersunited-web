/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Order Routing Service
 *
 * After Stripe payment succeeds, this service:
 *   1. Creates the Order in our database (with idempotency guard)
 *   2. Groups order items by supplier
 *   3. Dispatches each group to the correct supplier adapter
 *   4. Creates SupplierOrder records for tracking
 *
 * Idempotency: Uses Stripe session ID as idempotencyKey.
 * If we've already processed this session, we skip.
 */

import { prisma } from "@/lib/prisma";
import { SupplierRegistry } from "@/services/suppliers/registry";
import type { SupplierOrderRecipient } from "@/services/suppliers/types";

export interface StripeOrderData {
    stripeSessionId: string;
    userId: string;
    totalAmount: number;
    currency: string;
    recipient: SupplierOrderRecipient;
    items: Array<{
        variantId: string;
        quantity: number;
        price: number;
        title: string;
        productId: string;
    }>;
}

/**
 * Route an order to the correct supplier(s) after payment.
 *
 * Returns the created Order record.
 */
export async function routeOrderToSuppliers(data: StripeOrderData) {
    // ── 1. Idempotency guard ─────────────────────────────────────────────
    const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey: data.stripeSessionId },
    });

    if (existingOrder) {
        console.log(`[OrderRouter] Order already processed for session ${data.stripeSessionId}`);
        return existingOrder;
    }

    // ── 2. Fetch variants with supplier info ─────────────────────────────
    const variantIds = data.items.map((i) => i.variantId);
    const dbVariants = await prisma.variant.findMany({
        where: { id: { in: variantIds } },
        include: {
            product: {
                select: {
                    id: true,
                    supplierId: true,
                    supplierType: true,
                    providerId: true,
                },
            },
        },
    });

    // Build a lookup map
    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

    // ── 3. Create the order with items ───────────────────────────────────
    const order = await prisma.order.create({
        data: {
            userId: data.userId,
            totalAmount: data.totalAmount,
            currency: data.currency,
            externalId: data.stripeSessionId,
            idempotencyKey: data.stripeSessionId,
            status: "PAID",
            items: {
                create: data.items.map((item) => {
                    const dbVariant = variantMap.get(item.variantId);
                    return {
                        productId: item.productId,
                        title: item.title,
                        quantity: item.quantity,
                        price: item.price,
                        variantId: item.variantId,
                        supplierType: dbVariant?.product?.supplierType || "printful",
                    };
                }),
            },
        },
        include: {
            items: true,
        },
    });

    console.log(`[OrderRouter] Created order ${order.id} with ${order.items.length} items`);

    // ── 4. Group items by supplier type ──────────────────────────────────
    const itemsBySupplier: Record<string, typeof order.items> = {};

    for (const item of order.items) {
        const supplierType = item.supplierType;
        if (!itemsBySupplier[supplierType]) {
            itemsBySupplier[supplierType] = [];
        }
        itemsBySupplier[supplierType].push(item);
    }

    // ── 5. Dispatch to each supplier ─────────────────────────────────────
    for (const [supplierType, items] of Object.entries(itemsBySupplier)) {
        await dispatchToSupplier(order.id, supplierType, items, data.recipient);
    }

    // ── 6. Update order status ───────────────────────────────────────────
    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: "FULFILLING" },
        include: { items: true, supplierOrders: true },
    });

    return updatedOrder;
}

/**
 * Dispatch a group of items to a single supplier's adapter.
 */
async function dispatchToSupplier(
    orderId: string,
    supplierType: string,
    items: Array<{
        id: string;
        variantId: string | null;
        quantity: number;
        price: number;
    }>,
    recipient: SupplierOrderRecipient
) {
    // Look up the supplier DB record
    const supplier = await prisma.supplier.findUnique({
        where: { slug: supplierType },
    });

    if (!supplier) {
        console.error(`[OrderRouter] No supplier found for type: ${supplierType}`);
        // Fallback: for legacy printful orders without a supplier record,
        // still attempt fulfillment
        if (supplierType === "printful") {
            await dispatchPrintfulLegacy(orderId, items, recipient);
            return;
        }
        throw new Error(`Unknown supplier type: ${supplierType}`);
    }

    // Get the adapter
    const adapter = SupplierRegistry.get(supplierType);

    // Fetch the external variant IDs needed by the supplier
    const variantIds = items.map((i) => i.variantId).filter(Boolean) as string[];
    const dbVariants = await prisma.variant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, providerId: true, sku: true },
    });
    const variantLookup = new Map(dbVariants.map((v) => [v.id, v]));

    try {
        const result = await adapter.createOrder({
            orderId,
            recipient,
            items: items.map((item) => {
                const dbVariant = variantLookup.get(item.variantId || "");
                return {
                    externalVariantId: dbVariant?.providerId || item.variantId || "",
                    sku: dbVariant?.sku || null,
                    quantity: item.quantity,
                    unitPrice: item.price,
                };
            }),
        });

        // Create SupplierOrder record
        await prisma.supplierOrder.create({
            data: {
                orderId,
                supplierId: supplier.id,
                externalOrderId: result.externalOrderId,
                status: result.status,
                rawResponse: typeof result.rawResponse === "string"
                    ? result.rawResponse
                    : JSON.stringify(result.rawResponse),
            },
        });

        console.log(
            `[OrderRouter] ${supplierType} order created: ${result.externalOrderId} (status: ${result.status})`
        );
    } catch (err: any) {
        console.error(`[OrderRouter] Failed to create ${supplierType} order:`, err);

        // Still record the failure for manual resolution
        try {
            const supplierForError = await prisma.supplier.findUnique({
                where: { slug: supplierType },
            });
            if (supplierForError) {
                await prisma.supplierOrder.create({
                    data: {
                        orderId,
                        supplierId: supplierForError.id,
                        status: "FAILED",
                        errorMessage: err.message?.substring(0, 2000),
                    },
                });
            }
        } catch {
            // If even error logging fails, just log
        }

        throw err;
    }
}

/**
 * Legacy fallback: dispatch to Printful using the old flow
 * for orders that existed before the supplier migration.
 */
async function dispatchPrintfulLegacy(
    orderId: string,
    items: Array<{
        variantId: string | null;
        quantity: number;
    }>,
    recipient: SupplierOrderRecipient
) {
    const { createPrintfulOrder } = await import("@/services/printful");

    const variantIds = items.map((i) => i.variantId).filter(Boolean) as string[];
    const dbVariants = await prisma.variant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, providerId: true },
    });
    const variantLookup = new Map(dbVariants.map((v) => [v.id, v]));

    const printfulPayload = {
        external_id: orderId,
        items: items.map((item) => ({
            variant_id: variantLookup.get(item.variantId || "")?.providerId || item.variantId,
            quantity: item.quantity,
        })),
        customer: { email: recipient.email },
        shipping: {
            first_name: recipient.firstName,
            last_name: recipient.lastName,
            email: recipient.email,
            phone: recipient.phone,
            country: recipient.country,
            state: recipient.state,
            address1: recipient.address1,
            address2: recipient.address2,
            city: recipient.city,
            zip: recipient.zip,
        },
    };

    await createPrintfulOrder(printfulPayload);
    console.log(`[OrderRouter] Legacy Printful order dispatched for order ${orderId}`);
}
