/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Printful Adapter — wraps existing services/printful.ts
 *
 * This is a thin adapter layer on top of the existing Printful service.
 * It does NOT replace printful.ts — it delegates to it.
 */

import {
    SupplierAdapter,
    NormalizedProduct,
    NormalizedVariant,
    InventoryItem,
    SupplierOrderPayload,
    SupplierOrderResult,
    SupplierWebhookEvent,
} from "./types";
import {
    getPrintfulProducts,
    createPrintfulOrder,
    parseVariantAttributes,
    extractVariantImages,
    extractProductImages,
    type PrintfulProductDetail,
} from "@/services/printful";

export class PrintfulAdapter extends SupplierAdapter {
    readonly slug = "printful";
    readonly displayName = "Printful";

    /**
     * Fetch all products from the Printful store and normalize them.
     */
    async fetchProducts(): Promise<NormalizedProduct[]> {
        const details = await getPrintfulProducts();
        return details.map((pd) => this.normalizeProduct(pd));
    }

    /**
     * Printful is print-on-demand — no real inventory tracking.
     * Stock is always effectively unlimited (999).
     */
    async getInventory(externalVariantIds: string[]): Promise<InventoryItem[]> {
        // POD products are always in stock — return 999 for all
        return externalVariantIds.map((id) => ({
            externalVariantId: id,
            stock: 999,
        }));
    }

    /**
     * Create an order in Printful via the existing createPrintfulOrder function.
     */
    async createOrder(payload: SupplierOrderPayload): Promise<SupplierOrderResult> {
        const printfulPayload = {
            external_id: payload.orderId,
            items: payload.items.map((item) => ({
                variant_id: parseInt(item.externalVariantId, 10) || item.externalVariantId,
                quantity: item.quantity,
            })),
            customer: {
                email: payload.recipient.email,
            },
            shipping: {
                first_name: payload.recipient.firstName,
                last_name: payload.recipient.lastName,
                email: payload.recipient.email,
                phone: payload.recipient.phone,
                country: payload.recipient.country,
                state: payload.recipient.state,
                address1: payload.recipient.address1,
                address2: payload.recipient.address2,
                city: payload.recipient.city,
                zip: payload.recipient.zip,
            },
        };

        const result = await createPrintfulOrder(printfulPayload);

        return {
            externalOrderId: result.id?.toString() || result.external_id || payload.orderId,
            status: result.status || "pending",
            rawResponse: result,
        };
    }

    /**
     * Parse a Printful webhook payload into a normalized event.
     */
    parseWebhook(body: any): SupplierWebhookEvent {
        const eventType = body.type;
        const data = body.data;

        switch (eventType) {
            case "order_updated":
            case "order_created":
                return {
                    type: "fulfillment_update",
                    externalOrderId: data?.order?.external_id || data?.order?.id?.toString() || "",
                    status: data?.order?.status || "unknown",
                };
            case "package_shipped":
                return {
                    type: "tracking_update",
                    externalOrderId: data?.order?.external_id || data?.order?.id?.toString() || "",
                    status: "shipped",
                    trackingNumber: data?.shipment?.tracking_number,
                    trackingUrl: data?.shipment?.tracking_url,
                };
            case "order_canceled":
                return {
                    type: "order_cancelled",
                    externalOrderId: data?.order?.external_id || data?.order?.id?.toString() || "",
                    status: "cancelled",
                };
            default:
                return {
                    type: "unknown",
                    externalOrderId: "",
                    status: eventType || "unknown",
                };
        }
    }

    /**
     * Ping Printful API to check connectivity.
     */
    async healthCheck(): Promise<boolean> {
        try {
            const products = await getPrintfulProducts();
            return Array.isArray(products);
        } catch {
            return false;
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────

    private normalizeProduct(pd: PrintfulProductDetail): NormalizedProduct {
        const p = pd.sync_product;
        const variants = pd.sync_variants;

        const productImages = extractProductImages(p, variants);

        return {
            externalId: p.id.toString(),
            title: p.name,
            description: p.name, // Printful sync products don't have descriptions
            images: productImages.map((img) => img.url),
            thumbnailUrl: p.thumbnail_url || null,
            variants: variants.map((v) => this.normalizeVariant(v)),
        };
    }

    private normalizeVariant(v: any): NormalizedVariant {
        const { color, size } = parseVariantAttributes(v);
        const variantImages = extractVariantImages(v);
        const previewImg = variantImages.find(
            (img) => img.type === "preview" || img.type === "mockup"
        );

        return {
            externalId: v.id.toString(),
            title: v.name,
            sku: v.sku || null,
            costPrice: parseFloat(v.retail_price) || 0, // Printful retail = our cost (POD)
            retailPrice: parseFloat(v.retail_price) || 0,
            stock: 999, // POD = always in stock
            color,
            size,
            image: previewImg?.url || v.product?.image || null,
            images: variantImages.map((img) => img.url),
        };
    }
}
