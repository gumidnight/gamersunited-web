/**
 * Supplier module — public API
 */
export { SupplierRegistry } from "./registry";
export { PrintfulAdapter } from "./printful.adapter";
export { CJDropshippingAdapter } from "./cj.adapter";
export type {
    SupplierAdapter,
    NormalizedProduct,
    NormalizedVariant,
    InventoryItem,
    SupplierOrderPayload,
    SupplierOrderResult,
    SupplierWebhookEvent,
    SupplierOrderRecipient,
    SupplierOrderItem,
} from "./types";
