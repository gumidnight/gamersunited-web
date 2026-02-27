/**
 * Pricing Engine — automated margin calculation
 *
 * Applies markup logic to supplier cost prices.
 * Used during product sync to set retail prices.
 */

export interface PricingConfig {
    /** Default margin multiplier for all products */
    defaultMargin: number;
    /** Override margins per supplier slug */
    supplierMargins: Record<string, number>;
    /** Minimum retail price floor (prevents selling below cost) */
    minMarginPercent: number;
    /** Round prices to nearest X (e.g., 0.99 ending) */
    roundTo: "none" | "99cents" | "nearest-euro";
}

const DEFAULT_CONFIG: PricingConfig = {
    defaultMargin: 1.5,       // 50% markup
    supplierMargins: {
        printful: 1.0,         // Printful prices are already retail (POD)
        cj: 1.5,              // 50% markup on CJ cost
    },
    minMarginPercent: 20,      // At least 20% margin
    roundTo: "99cents",
};

/**
 * Calculate sale price from cost price.
 *
 * @param costPrice - Supplier cost price
 * @param supplierSlug - Which supplier (for margin lookup)
 * @param config - Optional override config
 * @returns Calculated retail/sale price
 */
export function calculateSalePrice(
    costPrice: number,
    supplierSlug: string,
    config: PricingConfig = DEFAULT_CONFIG
): number {
    if (costPrice <= 0) return 0;

    // Look up margin: supplier-specific > default
    const margin = config.supplierMargins[supplierSlug] ?? config.defaultMargin;

    let price = costPrice * margin;

    // Enforce minimum margin
    const minPrice = costPrice * (1 + config.minMarginPercent / 100);
    if (price < minPrice) {
        price = minPrice;
    }

    // Round
    switch (config.roundTo) {
        case "99cents":
            price = Math.floor(price) + 0.99;
            break;
        case "nearest-euro":
            price = Math.round(price);
            break;
        case "none":
        default:
            price = Math.round(price * 100) / 100;
            break;
    }

    return price;
}

/**
 * Check if a price change is significant enough to log.
 */
export function isPriceChangeSignificant(
    oldPrice: number,
    newPrice: number,
    thresholdPercent: number = 5
): boolean {
    if (oldPrice === 0) return newPrice !== 0;
    const changePercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
    return changePercent >= thresholdPercent;
}
