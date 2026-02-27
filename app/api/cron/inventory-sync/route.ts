/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/cron/inventory-sync
 *
 * Inventory sync endpoint — designed to be called by:
 *   - Cloudflare Cron Triggers (via fetch)
 *   - Manual admin trigger
 *   - External scheduler
 *
 * Protected by a shared secret in the query param or header.
 *
 * Example cron: every 6 hours via Cloudflare HTTP cron
 * URL: /api/cron/inventory-sync?key=YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { syncAllInventory } from "@/services/inventory/sync";
import { syncDropshipProducts } from "@/services/inventory/dropship-sync";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    // Auth: check cron secret
    const cronSecret = process.env.CRON_SECRET;
    const providedKey =
        req.nextUrl.searchParams.get("key") ||
        req.headers.get("X-Cron-Secret");

    if (cronSecret && providedKey !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const action = req.nextUrl.searchParams.get("action") || "inventory";
    const supplier = req.nextUrl.searchParams.get("supplier");

    try {
        switch (action) {
            case "inventory": {
                // Sync inventory levels for all suppliers
                const results = await syncAllInventory();
                return NextResponse.json({
                    success: true,
                    action: "inventory",
                    results,
                });
            }

            case "products": {
                // Full product sync for a specific dropship supplier
                if (!supplier) {
                    return NextResponse.json(
                        { error: "supplier query param required for product sync" },
                        { status: 400 }
                    );
                }

                const result = await syncDropshipProducts(supplier, "CRON");
                return NextResponse.json({
                    success: true,
                    action: "products",
                    supplier,
                    result,
                });
            }

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}. Use 'inventory' or 'products'` },
                    { status: 400 }
                );
        }
    } catch (err: any) {
        console.error(`[Cron] Error:`, err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
