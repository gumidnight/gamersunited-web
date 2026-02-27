/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CJ Dropshipping Adapter
 *
 * Integrates with the CJ Dropshipping API v2.0
 * Docs: https://developers.cjdropshipping.cn/en/api/api2/api/auth.html
 *
 * Key differences from Printful:
 *   - Real inventory (stock is finite, not POD)
 *   - Token-based auth: exchange apiKey for accessToken (15 day TTL)
 *   - Product search by category/keyword or curated lists
 *   - SKU-based variant identification
 *   - Inventory embedded in product detail response
 *
 * API Base: https://developers.cjdropshipping.com/api2.0/v1
 */

import { prisma } from "@/lib/prisma";
import {
    SupplierAdapter,
    NormalizedProduct,
    NormalizedVariant,
    InventoryItem,
    SupplierOrderPayload,
    SupplierOrderResult,
    SupplierWebhookEvent,
} from "./types";

const CJ_API_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

// ─────────────────────────────────────────────────────────────────────────────
// Token Management
//
// CJ auth flow (from docs):
//   POST /authentication/getAccessToken  { "apiKey": "CJ...@api@..." }
//   Returns: accessToken (15 days), refreshToken (180 days)
//   Constraint: getAccessToken can only be called once every 5 minutes
//
// We cache the token in memory. On Cloudflare Workers the instance is
// short-lived so this auto-refreshes naturally. For long-running dev
// servers we check expiry.
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let tokenCache: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    refreshExpiresAt: number;
} | null = null;

const CJ_SLUG_ALIASES = ["cj", "dj"] as const;

async function saveTokensToDb(data: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiryDate: string;
    refreshTokenExpiryDate: string;
}) {
    const tokenExpiresAt = new Date(data.accessTokenExpiryDate);
    const refreshExpiresAt = new Date(data.refreshTokenExpiryDate);

    const updates = await prisma.supplier.updateMany({
        where: { slug: { in: [...CJ_SLUG_ALIASES] } as any },
        data: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            tokenExpiresAt,
            refreshExpiresAt,
            isActive: true,
        },
    });

    // Ensure at least one canonical supplier row exists for token persistence
    if (updates.count === 0) {
        await prisma.supplier.upsert({
            where: { slug: "cj" },
            update: {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                tokenExpiresAt,
                refreshExpiresAt,
                isActive: true,
            },
            create: {
                slug: "cj",
                name: "CJ Dropshipping",
                isActive: true,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                tokenExpiresAt,
                refreshExpiresAt,
            },
        });
    }
}

async function loadTokenFromDb(): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    refreshExpiresAt: number;
} | null> {
    try {
        const row = await prisma.supplier.findFirst({
            where: {
                slug: { in: [...CJ_SLUG_ALIASES] as any },
                accessToken: { not: null },
                refreshToken: { not: null },
            },
            orderBy: { tokenExpiresAt: "desc" },
            select: {
                accessToken: true,
                refreshToken: true,
                tokenExpiresAt: true,
                refreshExpiresAt: true,
            },
        });

        if (!row?.accessToken || !row.refreshToken || !row.tokenExpiresAt || !row.refreshExpiresAt) {
            return null;
        }

        return {
            accessToken: row.accessToken,
            refreshToken: row.refreshToken,
            expiresAt: row.tokenExpiresAt.getTime(),
            refreshExpiresAt: row.refreshExpiresAt.getTime(),
        };
    } catch {
        return null;
    }
}

/**
 * Get a valid CJ access token.
 * Uses getAccessToken on first call, then refreshes via refreshAccessToken
 * when the access token is close to expiry.
 *
 * PERSISTENCE: Tokens are stored in the database (Supplier table)
 * to avoid "once per 5 min" auth limit across serverless functions.
 */
async function getCJAccessToken(): Promise<string> {
    const now = Date.now();

    // 1. Use in-memory cache first (stable and no DB dependency)
    if (tokenCache && now < tokenCache.expiresAt - 3_600_000) {
        return tokenCache.accessToken;
    }

    // 2. If memory cache expired but we have a refresh token, try refreshing
    if (tokenCache && tokenCache.refreshToken && now < tokenCache.refreshExpiresAt - 3_600_000) {
        try {
            return await refreshCJToken(tokenCache.refreshToken);
        } catch (e) {
            console.warn("[CJ] In-memory refresh failed, doing full auth.");
        }
    }

    // 3. Try DB-persisted tokens before full auth (critical for serverless cold starts)
    const dbToken = await loadTokenFromDb();
    if (dbToken) {
        tokenCache = dbToken;

        if (now < dbToken.expiresAt - 3_600_000) {
            return dbToken.accessToken;
        }

        if (now < dbToken.refreshExpiresAt - 3_600_000) {
            try {
                return await refreshCJToken(dbToken.refreshToken);
            } catch {
                // Fall through to full auth if DB refresh token failed
            }
        }
    }

    // 4. Full auth: exchange API key for tokens
    const apiKey = process.env.CJ_API_KEY;
    if (!apiKey) {
        throw new Error("[CJ] CJ_API_KEY environment variable is not set");
    }

    const url = `${CJ_API_BASE}/authentication/getAccessToken`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
        cache: "no-store",
    });

    const json = await res.json();

    if (json.code !== 200 || !json.data?.accessToken) {
        const errorMsg = json.message || JSON.stringify(json);
        console.error("[CJ] Auth failed:", errorMsg);

        if (errorMsg.includes("300 seconds") || errorMsg.includes("5 minutes")) {
            throw new Error("[CJ] Authentication cooldown active. CJ only allows getting a new token once every 5 minutes. Please wait 5 minutes and try again.");
        }

        throw new Error(`[CJ] Authentication failed: ${errorMsg}`);
    }

    // Update in-memory cache
    tokenCache = {
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
        expiresAt: new Date(json.data.accessTokenExpiryDate).getTime(),
        refreshExpiresAt: new Date(json.data.refreshTokenExpiryDate).getTime(),
    };

    console.log(
        `[CJ] Authenticated in memory. Token expires: ${json.data.accessTokenExpiryDate}`
    );

    // Attempt to background save to DB (will fail silently if schema not updated)
    // This way it won't crash the main request
    saveTokensToDb({
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
        accessTokenExpiryDate: json.data.accessTokenExpiryDate,
        refreshTokenExpiryDate: json.data.refreshTokenExpiryDate,
    }).catch(() => { });

    return tokenCache.accessToken;
}

/**
 * Refresh an expiring access token using the refresh token.
 */
async function refreshCJToken(refreshToken: string): Promise<string> {
    const url = `${CJ_API_BASE}/authentication/refreshAccessToken`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
    });

    const json = await res.json();

    if (json.code !== 200 || !json.data?.accessToken) {
        // Refresh failed — clear memory cache and do full auth
        console.warn("[CJ] Token refresh failed, will re-authenticate:", json.message);
        tokenCache = null;
        return getCJAccessToken();
    }

    tokenCache = {
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
        expiresAt: new Date(json.data.accessTokenExpiryDate).getTime(),
        refreshExpiresAt: new Date(json.data.refreshTokenExpiryDate).getTime(),
    };

    // Update DB in background
    saveTokensToDb({
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
        accessTokenExpiryDate: json.data.accessTokenExpiryDate,
        refreshTokenExpiryDate: json.data.refreshTokenExpiryDate,
    }).catch(() => { });

    console.log("[CJ] Token refreshed successfully in memory");
    return tokenCache.accessToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Client — rate limiting, retry, auto-token
// ─────────────────────────────────────────────────────────────────────────────

async function cjFetch(
    path: string,
    options: RequestInit = {},
    retries = 3
): Promise<any> {
    const token = await getCJAccessToken();

    const url = `${CJ_API_BASE}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            "CJ-Access-Token": token,
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        cache: "no-store",
    });

    // Token expired mid-flight — clear and retry
    if (res.status === 401) {
        tokenCache = null;
        if (retries > 0) {
            console.warn("[CJ] Token expired mid-request, refreshing…");
            return cjFetch(path, options, retries - 1);
        }
        throw new Error("[CJ] Authentication failed after token refresh");
    }

    // Rate limit
    if (res.status === 429) {
        if (retries === 0) {
            throw new Error("[CJ] Rate limit exceeded after all retries");
        }
        const backoff = Math.pow(2, 3 - retries) * 2000;
        console.warn(`[CJ] Rate limited. Waiting ${backoff / 1000}s (${retries} retries left)`);
        await sleep(backoff);
        return cjFetch(path, options, retries - 1);
    }

    if (!res.ok) {
        const body = await res.text().catch(() => res.statusText);
        throw new Error(`[CJ] HTTP ${res.status} → ${url}\n${body}`);
    }

    const json = await res.json();

    // CJ wraps all responses: { code, result, message, data }
    if (json.code !== 200) {
        throw new Error(`[CJ] API error ${json.code}: ${json.message || JSON.stringify(json)}`);
    }

    return json.data;
}

async function cjPost(path: string, body: any): Promise<any> {
    return cjFetch(path, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter Implementation
// ─────────────────────────────────────────────────────────────────────────────

export class CJDropshippingAdapter extends SupplierAdapter {
    readonly slug = "cj";
    readonly displayName = "CJ Dropshipping";

    /**
     * Fetch products from CJ.
     *
     * CJ doesn't have a "store sync" concept like Printful.
     * Options:
     *   - CJ_CATEGORY_ID: import by category
     *   - CJ_PRODUCT_IDS: comma-separated PIDs to import specific products
     *   - Falls back to general product list
     */
    async fetchProducts(): Promise<NormalizedProduct[]> {
        const specificPids = process.env.CJ_PRODUCT_IDS;
        const categoryId = process.env.CJ_CATEGORY_ID;

        if (specificPids) {
            return this.fetchByPids(specificPids.split(",").map((s) => s.trim()));
        }

        if (categoryId) {
            return this.fetchByCategory(categoryId);
        }

        // Default: fetch general product list (first 5 pages)
        return this.fetchGeneralList();
    }

    /**
     * Get real inventory for CJ variants.
     * CJ endpoint: GET /product/stock/queryByVid?vid=XXX
     * Note: this is per-variant, one vid at a time.
     */
    async getInventory(externalVariantIds: string[]): Promise<InventoryItem[]> {
        const results: InventoryItem[] = [];

        for (const vid of externalVariantIds) {
            try {
                // CJ inventory endpoint is GET with query param
                const data = await cjFetch(`/product/stock/queryByVid?vid=${vid}`);

                if (Array.isArray(data) && data.length > 0) {
                    // Sum totalInventoryNum across all warehouses
                    const totalStock = data.reduce(
                        (sum: number, warehouse: any) => sum + (warehouse.totalInventoryNum || 0),
                        0
                    );

                    results.push({
                        externalVariantId: vid,
                        stock: totalStock,
                    });
                } else {
                    results.push({ externalVariantId: vid, stock: 0 });
                }
            } catch (err) {
                console.error(`[CJ] Failed to fetch inventory for vid ${vid}:`, err);
                results.push({ externalVariantId: vid, stock: 0 });
            }

            // Respect rate limits
            await sleep(200);
        }

        return results;
    }

    /**
     * Create an order in CJ Dropshipping.
     * POST /shopping/order/createOrderV2
     */
    async createOrder(payload: SupplierOrderPayload): Promise<SupplierOrderResult> {
        const cjPayload = {
            orderNumber: payload.orderId,
            shippingZip: payload.recipient.zip,
            shippingCountryCode: payload.recipient.country,
            shippingCountry: payload.recipient.country,
            shippingProvince: payload.recipient.state,
            shippingCity: payload.recipient.city,
            shippingAddress: payload.recipient.address1,
            shippingAddress2: payload.recipient.address2 || "",
            shippingCustomerName: `${payload.recipient.firstName} ${payload.recipient.lastName}`,
            shippingPhone: payload.recipient.phone,
            remark: "",
            products: payload.items.map((item) => ({
                vid: item.externalVariantId,
                quantity: item.quantity,
                ...(item.sku ? { sku: item.sku } : {}),
            })),
        };

        const result = await cjPost("/shopping/order/createOrderV2", cjPayload);

        return {
            externalOrderId: result?.orderId || result?.orderNum || payload.orderId,
            status: "pending",
            rawResponse: result,
        };
    }

    /**
     * Parse CJ webhook payload into a normalized event.
     */
    parseWebhook(body: any): SupplierWebhookEvent {
        const eventType = body.type || body.eventType;

        switch (eventType) {
            case "ORDER_STATUS_CHANGE":
                return {
                    type: "fulfillment_update",
                    externalOrderId: body.data?.orderId || body.orderId || "",
                    status: body.data?.orderStatus || "unknown",
                };
            case "TRACKING_UPDATE":
                return {
                    type: "tracking_update",
                    externalOrderId: body.data?.orderId || body.orderId || "",
                    status: "shipped",
                    trackingNumber: body.data?.trackingNumber,
                    trackingUrl: body.data?.trackingUrl,
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
     * Health check — try fetching 1 product from the list.
     */
    async healthCheck(): Promise<boolean> {
        try {
            await cjFetch("/product/list?pageNum=1&pageSize=1");
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Public implementation of fetchSingleProduct for CJ.
     */
    async fetchSingleProduct(pid: string): Promise<NormalizedProduct | null> {
        return this.fetchProductDetail(pid);
    }

    // ── Private: Product fetching strategies ─────────────────────────────

    private async fetchByPids(pids: string[]): Promise<NormalizedProduct[]> {
        const products: NormalizedProduct[] = [];

        for (const pid of pids) {
            const detail = await this.fetchProductDetail(pid);
            if (detail) products.push(detail);
            await sleep(300);
        }

        return products;
    }

    private async fetchByCategory(categoryId: string): Promise<NormalizedProduct[]> {
        const allProducts: NormalizedProduct[] = [];
        let pageNum = 1;
        const maxPages = 10;

        while (pageNum <= maxPages) {
            try {
                const data = await cjFetch(
                    `/product/list?pageNum=${pageNum}&pageSize=200&categoryId=${categoryId}`
                );

                const list = data?.list || [];
                if (!Array.isArray(list) || list.length === 0) break;

                for (const p of list) {
                    const detail = await this.fetchProductDetail(p.pid);
                    if (detail) allProducts.push(detail);
                    await sleep(300);
                }

                if (list.length < 200) break;
                pageNum++;
            } catch (err) {
                console.error(`[CJ] Category fetch page ${pageNum} failed:`, err);
                break;
            }
        }

        return allProducts;
    }

    private async fetchGeneralList(): Promise<NormalizedProduct[]> {
        const allProducts: NormalizedProduct[] = [];
        let pageNum = 1;
        const maxPages = 5;

        while (pageNum <= maxPages) {
            try {
                const data = await cjFetch(
                    `/product/list?pageNum=${pageNum}&pageSize=200`
                );

                const list = data?.list || [];
                if (!Array.isArray(list) || list.length === 0) break;

                for (const p of list) {
                    const detail = await this.fetchProductDetail(p.pid);
                    if (detail) allProducts.push(detail);
                    await sleep(300);
                }

                if (list.length < 200) break;
                pageNum++;
            } catch (err) {
                console.error(`[CJ] General list page ${pageNum} failed:`, err);
                break;
            }
        }

        return allProducts;
    }

    /**
     * Fetch full product detail including variants and inventory.
     * GET /product/query?pid=XXX
     */
    private async fetchProductDetail(pid: string): Promise<NormalizedProduct | null> {
        try {
            const detail = await cjFetch(`/product/query?pid=${pid}`);
            if (!detail) return null;
            return this.normalizeProduct(detail);
        } catch (err: any) {
            console.error(`[CJ] Failed to fetch product ${pid}:`, err);
            // Re-throw so the caller (and the admin user) sees the actual API error
            throw new Error(`CJ API Error for product ${pid}: ${err.message || "Unknown error"}`);
        }
    }

    // ── Private: Normalization ────────────────────────────────────────────

    private normalizeProduct(p: any): NormalizedProduct {
        // Images
        const images: string[] = [];
        if (p.productImage) images.push(p.productImage);
        if (Array.isArray(p.productImageSet)) {
            for (const img of p.productImageSet) {
                if (typeof img === "string" && !images.includes(img)) images.push(img);
            }
        }

        // Variants — from the product detail response
        const variants: NormalizedVariant[] = [];
        if (Array.isArray(p.variants) && p.variants.length > 0) {
            for (const v of p.variants) {
                variants.push(this.normalizeVariant(v, p));
            }
        } else {
            // Single-variant product
            variants.push({
                externalId: p.pid,
                title: p.productNameEn || p.productName || "Default",
                sku: p.productSku || null,
                costPrice: parseFloat(p.sellPrice) || 0,
                retailPrice: parseFloat(p.sellPrice) || 0,
                stock: 0, // Will be populated by inventory sync
                color: null,
                size: null,
                image: p.productImage || null,
                images,
            });
        }

        return {
            externalId: p.pid,
            title: p.productNameEn || p.productName || "Untitled",
            description: p.description || p.productNameEn || "",
            images,
            thumbnailUrl: p.productImage || null,
            variants,
        };
    }

    private normalizeVariant(v: any, product: any): NormalizedVariant {
        const images: string[] = [];
        if (v.variantImage) images.push(v.variantImage);
        if (product.productImage && !images.includes(product.productImage)) {
            images.push(product.productImage);
        }

        // Parse color/size from variantKey
        // variantKey is like "Black" or "[\"XS\"]" or "[\"Red\", \"L\"]"
        let color: string | null = null;
        let size: string | null = null;

        const sizePattern = /^(XXS|XS|S|M|L|XL|2XL|3XL|4XL|5XL|\d+XL)$/i;

        if (v.variantKey) {
            let keys: string[] = [];
            try {
                const parsed = JSON.parse(v.variantKey);
                keys = Array.isArray(parsed) ? parsed : [v.variantKey];
            } catch {
                keys = [v.variantKey];
            }

            for (const key of keys) {
                if (sizePattern.test(key.trim())) {
                    size = key.trim();
                } else {
                    color = key.trim();
                }
            }
        }

        // Stock: sum totalInventoryNum from embedded inventories array
        let stock = 0;
        if (Array.isArray(v.inventories)) {
            stock = v.inventories.reduce(
                (sum: number, inv: any) => sum + (inv.totalInventoryNum || inv.totalInventory || 0),
                0
            );
        }

        return {
            externalId: v.vid,
            title: v.variantNameEn || v.variantName || `${color || ""} ${size || ""}`.trim() || "Default",
            sku: v.variantSku || null,
            costPrice: parseFloat(v.variantSellPrice) || parseFloat(product.sellPrice) || 0,
            retailPrice: parseFloat(v.variantSellPrice) || parseFloat(product.sellPrice) || 0,
            stock,
            color,
            size,
            image: v.variantImage || product.productImage || null,
            images,
        };
    }
}
