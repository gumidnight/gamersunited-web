/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Printful Integration Service — Production-Ready
 *
 * Handles all interaction with the Printful API including:
 *   - Authentication (Bearer token)
 *   - Product & variant fetching with pagination
 *   - Rate limit management (120 req/min)
 *   - Exponential backoff on 429 responses
 *   - Mockup generation task management
 *   - Webhook setup
 *
 * Official docs: https://developers.printful.com/docs/
 */

const PRINTFUL_API_URL = "https://api.printful.com";

// ─────────────────────────────────────────────────────────────────────────────
// Auth & HTTP
// ─────────────────────────────────────────────────────────────────────────────

function getHeaders(): Record<string, string> {
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (!apiKey) {
        throw new Error("PRINTFUL_API_KEY is missing. Set it in your environment variables.");
    }
    return {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-PF-Language": "en",
    };
}

/** Sleep helper for rate limiting */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Rate-limit-aware fetch wrapper with automatic retry and exponential backoff.
 *
 * Printful allows 120 requests per minute. This function:
 *  1. Monitors the `x-ratelimit-remaining` header
 *  2. Proactively pauses when < 10 requests remain
 *  3. Retries with backoff on 429 status
 *  4. Throws on non-recoverable errors
 */
async function printfulFetch(
    url: string,
    options: RequestInit = {},
    retries = 4
): Promise<any> {
    const res = await fetch(url, {
        ...options,
        headers: { ...getHeaders(), ...(options.headers || {}) },
        cache: "no-store",
    });

    // Proactively back off when approaching rate limit
    const remaining = parseInt(res.headers.get("x-ratelimit-remaining") ?? "60", 10);
    if (remaining < 10) {
        console.warn(`[Printful] Rate limit approaching (${remaining} remaining), pausing 1.5s…`);
        await sleep(1500);
    }

    // Handle 429 Too Many Requests
    if (res.status === 429) {
        if (retries === 0) {
            throw new Error("[Printful] Rate limit exceeded after all retries.");
        }
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "10", 10);
        const backoff = retryAfter * 1000 * Math.pow(1.5, 4 - retries);
        console.warn(
            `[Printful] Rate limited. Waiting ${Math.round(backoff / 1000)}s before retry (${retries} left)…`
        );
        await sleep(backoff);
        return printfulFetch(url, options, retries - 1);
    }

    if (!res.ok) {
        const body = await res.text().catch(() => res.statusText);
        throw new Error(`[Printful] HTTP ${res.status} → ${url}\n${body}`);
    }

    const json = await res.json();
    return json.result;
}

/**
 * POST to Printful API.
 */
async function printfulPost(url: string, body: any): Promise<any> {
    return printfulFetch(url, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PrintfulFile {
    id: number;
    type: string; // "default", "preview", "back", "front", "lifestyle", etc.
    url: string;
    preview_url?: string;
    filename?: string;
}

export interface PrintfulSyncVariant {
    id: number;
    external_id?: string;
    sync_product_id: number;
    name: string;
    synced: boolean;
    retail_price: string;
    currency: string;
    sku?: string;
    color?: string;
    size?: string;
    variant_id?: number; // Printful catalog variant ID
    files: PrintfulFile[];
    /** Options array from catalog e.g. [{id:"color", value:"White"}, {id:"size", value:"L"}] */
    options?: Array<{ id: string; value: string }>;
    /** Product information including catalog product_id */
    product?: {
        variant_id: number;
        product_id: number;
        image: string;
        name: string;
    };
}

export interface PrintfulSyncProduct {
    id: number;
    external_id?: string;
    name: string;
    synced: number;
    thumbnail_url?: string;
    is_ignored: boolean;
}

export interface PrintfulProductDetail {
    sync_product: PrintfulSyncProduct;
    sync_variants: PrintfulSyncVariant[];
}

export interface MockupTask {
    task_key: string;
    status: string;
}

export interface MockupResult {
    task_key: string;
    status: "pending" | "completed" | "error";
    mockups?: Array<{
        placement: string;
        variant_ids: number[];
        mockup_url: string;
        extra: Array<{ title: string; url: string; option: string; option_group: string }>;
    }>;
    error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse color and size from the variant name.
 * Printful variant names follow patterns like:
 *   "Black / XL"  |  "Hoodie / Navy / M"  |  "S"  |  "White"
 *
 * Priority: explicit fields > options array > name parsing
 */
export function parseVariantAttributes(
    variant: PrintfulSyncVariant
): { color: string | null; size: string | null } {
    // 1. Try explicit top-level fields first (most reliable)
    if (variant.color || variant.size) {
        return {
            color: variant.color ?? null,
            size: variant.size ?? null,
        };
    }

    // 2. Try options array (populated for catalog products)
    const opts = variant.options ?? [];
    const colorOpt = opts.find((o) => o.id.toLowerCase() === "color")?.value ?? null;
    const sizeOpt = opts.find((o) => o.id.toLowerCase() === "size")?.value ?? null;
    if (colorOpt || sizeOpt) {
        return { color: colorOpt, size: sizeOpt };
    }

    // 3. Fall back to parsing the name string
    const parts = variant.name
        .split(/[-\/]/)
        .map((s) => s.trim())
        .filter(Boolean);

    const sizePattern = /^(XXS|XS|S|M|L|XL|2XL|3XL|4XL|5XL|\d+XL)$/i;
    const size = parts.find((p) => sizePattern.test(p)) ?? null;
    // Color is anything that isn't the size or the product name (first part)
    const color =
        parts.length > 1
            ? parts.find((p) => !sizePattern.test(p) && p !== parts[0]) ?? null
            : null;

    return { color, size };
}

/**
 * Collect all mockup / preview image URLs for a variant.
 * Returns deduplicated array with type metadata.
 */
export function extractVariantImages(
    variant: PrintfulSyncVariant
): Array<{ url: string; type: string }> {
    const seen = new Set<string>();
    const images: Array<{ url: string; type: string }> = [];

    for (const f of variant.files ?? []) {
        // Only include mockups/previews, ignore raw design files ("front", "back", "default", etc.)
        if (f.type !== "preview" && f.type !== "mockup" && f.type !== "lifestyle") {
            continue;
        }

        const url = f.preview_url || f.url;
        if (url && !seen.has(url)) {
            seen.add(url);
            images.push({ url, type: f.type || "preview" });
        }
    }

    return images;
}

/**
 * Extract all unique product-level images across all variants.
 */
export function extractProductImages(
    product: PrintfulSyncProduct,
    variants: PrintfulSyncVariant[]
): Array<{ url: string; type: string }> {
    const seen = new Set<string>();
    const images: Array<{ url: string; type: string }> = [];

    // Add thumbnail
    if (product.thumbnail_url && !seen.has(product.thumbnail_url)) {
        seen.add(product.thumbnail_url);
        images.push({ url: product.thumbnail_url, type: "thumbnail" });
    }

    // Collect unique preview images from all variants
    for (const v of variants) {
        for (const f of v.files ?? []) {
            if (f.type === "preview" && (f.preview_url || f.url)) {
                const url = f.preview_url || f.url;
                if (!seen.has(url)) {
                    seen.add(url);
                    images.push({ url, type: "preview" });
                }
            }
        }
    }

    return images;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — Products
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all store products with full variant + mockup details.
 * Uses sequential per-product fetches to stay within rate limits.
 */
export async function getPrintfulProducts(): Promise<PrintfulProductDetail[]> {
    // Step 1: Get paginated list of sync products
    const allProducts: PrintfulSyncProduct[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
        const page = (await printfulFetch(
            `${PRINTFUL_API_URL}/store/products?offset=${offset}&limit=${limit}`
        )) as PrintfulSyncProduct[];

        if (!page || page.length === 0) break;
        allProducts.push(...page);
        if (page.length < limit) break;
        offset += limit;
    }

    console.log(`[Printful] Found ${allProducts.length} sync products. Fetching details…`);

    // Step 2: Fetch details SEQUENTIALLY to respect rate limits
    const details: PrintfulProductDetail[] = [];
    for (let i = 0; i < allProducts.length; i++) {
        const p = allProducts[i];
        try {
            const detail = (await printfulFetch(
                `${PRINTFUL_API_URL}/store/products/${p.id}`
            )) as PrintfulProductDetail;
            details.push(detail);
            console.log(
                `[Printful] Fetched ${i + 1}/${allProducts.length}: ${p.name} (${detail.sync_variants.length} variants)`
            );
        } catch (err) {
            console.error(`[Printful] Failed to fetch product ${p.id} (${p.name}):`, err);
            // Continue with remaining products — don't abort the whole sync
        }
        // Small pause between requests: ~109 req/min max (well under 120 limit)
        await sleep(550);
    }

    return details;
}

/**
 * Fetch a single product's full detail from Printful.
 */
export async function getPrintfulProduct(productId: number): Promise<PrintfulProductDetail> {
    return printfulFetch(`${PRINTFUL_API_URL}/store/products/${productId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — Orders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates an order in Printful after successful payment.
 */
export async function createPrintfulOrder(orderData: any): Promise<any> {
    return printfulPost(`${PRINTFUL_API_URL}/orders`, {
        external_id: orderData.external_id,
        recipient: {
            name: `${orderData.shipping.first_name} ${orderData.shipping.last_name}`,
            address1: orderData.shipping.address1,
            address2: orderData.shipping.address2 || "",
            city: orderData.shipping.city,
            state_code: orderData.shipping.state || "",
            country_code: orderData.shipping.country,
            zip: orderData.shipping.zip,
            email: orderData.customer.email,
            phone: orderData.shipping.phone || "",
        },
        items: orderData.items.map((item: any) => ({
            sync_variant_id: item.variant_id,
            quantity: item.quantity,
        })),
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — Mockup Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a mockup generation task for a product.
 * This is async — you must poll for the result using getMockupTaskResult().
 *
 * Rate limit: 10 req/60s for established stores, 2 req/60s for new stores.
 *
 * @param catalogProductId - The CATALOG product ID (not sync product ID)
 * @param variantIds - List of CATALOG variant IDs to generate mockups for
 * @param files - Array of { placement, image_url } for print files
 * @param format - "png" or "jpg" (default: "jpg")
 */
export async function createMockupTask(
    catalogProductId: number,
    variantIds: number[],
    files: Array<{ placement: string; image_url: string; position?: any }>,
    format: "png" | "jpg" = "jpg"
): Promise<MockupTask> {
    return printfulPost(`${PRINTFUL_API_URL}/mockup-generator/create-task/${catalogProductId}`, {
        variant_ids: variantIds,
        format,
        files,
    });
}

/**
 * Poll for mockup generation task result.
 * Returns the task status and generated mockup URLs when complete.
 */
export async function getMockupTaskResult(taskKey: string): Promise<MockupResult> {
    return printfulFetch(`${PRINTFUL_API_URL}/mockup-generator/task?task_key=${taskKey}`);
}

/**
 * Wait for a mockup task to complete, polling at intervals.
 * Times out after maxWaitMs (default 120 seconds).
 */
export async function waitForMockupTask(
    taskKey: string,
    pollIntervalMs = 5000,
    maxWaitMs = 120_000
): Promise<MockupResult> {
    const start = Date.now();

    // First poll after 10s as per Printful docs
    await sleep(10_000);

    while (Date.now() - start < maxWaitMs) {
        const result = await getMockupTaskResult(taskKey);
        if (result.status === "completed" || result.status === "error") {
            return result;
        }
        await sleep(pollIntervalMs);
    }

    throw new Error(`[Printful] Mockup task ${taskKey} timed out after ${maxWaitMs / 1000}s`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — Webhooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register webhook URL with Printful for real-time product sync notifications.
 *
 * Important: Only one webhook URL can be active per store.
 * Calling this replaces any previously configured webhook.
 */
export async function setupWebhooks(webhookUrl: string): Promise<any> {
    return printfulPost(`${PRINTFUL_API_URL}/webhooks`, {
        url: webhookUrl,
        types: [
            "product_synced",
            "product_updated",
            "product_deleted",
        ],
    });
}

/**
 * Get current webhook configuration.
 */
export async function getWebhookConfig(): Promise<any> {
    return printfulFetch(`${PRINTFUL_API_URL}/webhooks`);
}

/**
 * Disable all webhooks for the store.
 */
export async function disableWebhooks(): Promise<any> {
    return printfulFetch(`${PRINTFUL_API_URL}/webhooks`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — Catalog (for browsing available products)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all products from the Printful catalog (not your store products).
 * Useful for browsing what blank products are available.
 */
export async function getCatalogProducts(categoryIds?: number[]): Promise<any[]> {
    const params = categoryIds ? `?category_ids=${categoryIds.join(",")}` : "";
    return printfulFetch(`${PRINTFUL_API_URL}/products${params}`);
}

/**
 * Fetch a single catalog product with all its variants.
 */
export async function getCatalogProduct(productId: number): Promise<any> {
    return printfulFetch(`${PRINTFUL_API_URL}/products/${productId}`);
}
