/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Supplier Adapter — Abstract interface
 *
 * Every supplier (Printful, CJ, future) implements this contract.
 * The order router and sync engine only talk to this interface.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Normalized types — supplier-agnostic
// ─────────────────────────────────────────────────────────────────────────────

export interface NormalizedProduct {
    externalId: string;
    title: string;
    description: string;
    images: string[];
    thumbnailUrl: string | null;
    variants: NormalizedVariant[];
}

export interface NormalizedVariant {
    externalId: string;
    title: string;
    sku: string | null;
    costPrice: number;
    retailPrice: number;
    stock: number; // Printful = 999 (POD), CJ = actual count
    color: string | null;
    size: string | null;
    image: string | null;
    images: string[];
}

export interface SupplierOrderRecipient {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    country: string;
    zip: string;
}

export interface SupplierOrderItem {
    externalVariantId: string;
    sku: string | null;
    quantity: number;
    /** Unit price to print on packing slip (optional, supplier-dependent) */
    unitPrice?: number;
}

export interface SupplierOrderPayload {
    /** Our internal order ID — used as external_id by the supplier */
    orderId: string;
    recipient: SupplierOrderRecipient;
    items: SupplierOrderItem[];
}

export interface SupplierOrderResult {
    externalOrderId: string;
    status: string;
    rawResponse?: any;
}

export interface SupplierWebhookEvent {
    type: "fulfillment_update" | "tracking_update" | "order_cancelled" | "unknown";
    externalOrderId: string;
    status: string;
    trackingNumber?: string;
    trackingUrl?: string;
}

export interface InventoryItem {
    externalVariantId: string;
    stock: number;
    /** If the supplier returns updated cost, include it */
    costPrice?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Abstract adapter
// ─────────────────────────────────────────────────────────────────────────────

export abstract class SupplierAdapter {
    abstract readonly slug: string;
    abstract readonly displayName: string;

    /**
     * Fetch all products from this supplier and return normalized data.
     * Called during full product sync.
     */
    abstract fetchProducts(): Promise<NormalizedProduct[]>;

    /**
     * Fetch inventory/stock for specific variant IDs.
     * Called during inventory cron sync.
     */
    abstract getInventory(externalVariantIds: string[]): Promise<InventoryItem[]>;

    /**
     * Submit an order to the supplier for fulfillment.
     * Called by the order router after payment succeeds.
     */
    abstract createOrder(payload: SupplierOrderPayload): Promise<SupplierOrderResult>;

    /**
     * Parse an incoming webhook payload into a normalized event.
     * Each supplier webhook format is different.
     */
    abstract parseWebhook(body: any): SupplierWebhookEvent;

    /**
     * Check if the supplier API is reachable. Used for health checks.
     */
    abstract healthCheck(): Promise<boolean>;

    /**
     * Fetch a single product by its external ID.
     * Optional implementation for suppliers that support direct PID/ID lookup.
     */
    async fetchSingleProduct(externalId: string): Promise<NormalizedProduct | null> {
        return null;
    }
}
