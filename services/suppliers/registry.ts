/**
 * Supplier Registry — singleton lookup for supplier adapters
 *
 * Register all adapters here. The order router and sync engine
 * use SupplierRegistry.get("slug") to find the right adapter.
 */

import { SupplierAdapter } from "./types";
import { PrintfulAdapter } from "./printful.adapter";
import { CJDropshippingAdapter } from "./cj.adapter";

const adapters: Map<string, SupplierAdapter> = new Map();

// Register all known adapters
adapters.set("printful", new PrintfulAdapter());
adapters.set("cj", new CJDropshippingAdapter());
adapters.set("dj", new CJDropshippingAdapter()); // alias for teams using "DJ" naming

export const SupplierRegistry = {
    /**
     * Get an adapter by supplier slug. Throws if not found.
     */
    get(slug: string): SupplierAdapter {
        const adapter = adapters.get(slug);
        if (!adapter) {
            throw new Error(`[SupplierRegistry] No adapter registered for supplier: "${slug}"`);
        }
        return adapter;
    },

    /**
     * Check if an adapter exists for a given slug.
     */
    has(slug: string): boolean {
        return adapters.has(slug);
    },

    /**
     * Get all registered adapter slugs.
     */
    slugs(): string[] {
        return Array.from(adapters.keys());
    },

    /**
     * Register a new adapter at runtime (for future extensibility).
     */
    register(adapter: SupplierAdapter): void {
        adapters.set(adapter.slug, adapter);
    },
};
