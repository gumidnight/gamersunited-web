/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { routeOrderToSuppliers } from "@/services/orders/router";
import type { SupplierOrderRecipient } from "@/services/suppliers/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2023-10-16" as any,
        httpClient: Stripe.createFetchHttpClient(),
    });

    const payload = await req.text();
    const signature = req.headers.get("Stripe-Signature") as string;
    let event: Stripe.Event;

    try {
        event = await stripe.webhooks.constructEventAsync(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        console.error(`[Stripe Webhook] Signature verification failed:`, err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // ── Handle successful checkout ───────────────────────────────────────
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        // ── Idempotency: check if we already processed this session ──────
        const existingOrder = await prisma.order.findUnique({
            where: { idempotencyKey: session.id },
        });

        if (existingOrder) {
            console.log(`[Stripe Webhook] Already processed session ${session.id}, skipping`);
            return NextResponse.json({
                success: true,
                message: "Already processed",
                orderId: existingOrder.id,
            });
        }

        // ── Expand session to get full details ───────────────────────────
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["line_items", "line_items.data.price.product", "customer_details"],
        });

        const shipping = (fullSession as any).shipping_details?.address;
        const nameParts = ((fullSession as any).shipping_details?.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || firstName;

        const recipient: SupplierOrderRecipient = {
            firstName,
            lastName,
            email: fullSession.customer_details?.email || "",
            phone: fullSession.customer_details?.phone || "",
            address1: shipping?.line1 || "",
            address2: shipping?.line2 || "",
            city: shipping?.city || "",
            state: shipping?.state || "",
            country: shipping?.country || "",
            zip: shipping?.postal_code || "",
        };

        // ── Build order items from Stripe line items ─────────────────────
        const lineItems = fullSession.line_items?.data || [];
        const orderItems: Array<{
            variantId: string;
            quantity: number;
            price: number;
            title: string;
            productId: string;
        }> = [];

        for (const li of lineItems) {
            const product = li.price?.product as any;
            const metadata = product?.metadata || li.price?.metadata || {};

            // Get the variant ID from metadata
            const printfulVariantId = metadata.printful_variant_id;
            const variantDbId = metadata.variant_db_id;

            if (variantDbId) {
                // New flow: variant DB ID stored in metadata
                const variant = await prisma.variant.findUnique({
                    where: { id: variantDbId },
                    select: { id: true, productId: true },
                });

                if (variant) {
                    orderItems.push({
                        variantId: variant.id,
                        quantity: li.quantity || 1,
                        price: (li.amount_total || 0) / 100 / (li.quantity || 1),
                        title: product?.name || li.description || "",
                        productId: variant.productId,
                    });
                }
            } else if (printfulVariantId) {
                // Legacy flow: look up by Printful provider ID
                const variant = await prisma.variant.findUnique({
                    where: { providerId: printfulVariantId },
                    select: { id: true, productId: true },
                });

                if (variant) {
                    orderItems.push({
                        variantId: variant.id,
                        quantity: li.quantity || 1,
                        price: (li.amount_total || 0) / 100 / (li.quantity || 1),
                        title: product?.name || li.description || "",
                        productId: variant.productId,
                    });
                }
            }
        }

        if (orderItems.length === 0) {
            console.error("[Stripe Webhook] Could not resolve any order items from session");
            return NextResponse.json({ error: "No resolvable items" }, { status: 200 });
        }

        // ── Route to suppliers ───────────────────────────────────────────
        try {
            const order = await routeOrderToSuppliers({
                stripeSessionId: session.id,
                userId: fullSession.metadata?.userId || "guest",
                totalAmount: (fullSession.amount_total || 0) / 100,
                currency: fullSession.currency || "eur",
                recipient,
                items: orderItems,
            });

            console.log(`[Stripe Webhook] Order ${order.id} routed to suppliers`);

            return NextResponse.json({
                success: true,
                message: "Order processed and routed to suppliers",
                orderId: order.id,
            });
        } catch (err: any) {
            console.error("[Stripe Webhook] Order routing failed:", err);
            // Return 500 so Stripe retries (idempotency guard will prevent double processing)
            return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
        }
    }

    // Acknowledge other event types
    return NextResponse.json({ received: true });
}
