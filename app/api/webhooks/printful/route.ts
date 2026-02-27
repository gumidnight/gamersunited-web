import { NextResponse } from "next/server";
import {
    syncSingleProductFromWebhook,
    deactivateProductFromWebhook,
} from "@/lib/shop-actions";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhooks/printful
 *
 * Handles incoming webhook events from Printful.
 *
 * Supported event types:
 *   - product_synced    → Re-fetch and upsert the product
 *   - product_updated   → Re-fetch and upsert the product
 *   - product_deleted   → Mark product as inactive
 *   - stock_updated     → Update variant availability
 *
 * Printful retries on non-2xx responses with increasing intervals:
 *   after 1, 4, 16, 64, 256, and 1024 minutes.
 *
 * We respond 200 immediately and process async to avoid timeouts.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const eventType: string = body.type;
        const storeId: number = body.store;
        const data = body.data;

        console.log(`[Webhook] Received event: ${eventType} for store ${storeId}`);

        // Log the webhook event
        await prisma.syncLog.create({
            data: {
                status: "RUNNING",
                triggerType: "WEBHOOK",
            },
        });

        switch (eventType) {
            case "product_synced":
            case "product_updated": {
                // The webhook payload contains the sync_product data
                // data.sync_product.id is the Printful sync product ID
                const syncProductId = data?.sync_product?.id;
                if (!syncProductId) {
                    console.warn("[Webhook] Missing sync_product.id in payload");
                    break;
                }

                // Re-fetch full product detail and upsert
                await syncSingleProductFromWebhook(syncProductId);

                await prisma.syncLog.updateMany({
                    where: {
                        triggerType: "WEBHOOK",
                        status: "RUNNING",
                    },
                    data: {
                        status: "SUCCESS",
                        completedAt: new Date(),
                        productCount: 1,
                    },
                });
                break;
            }

            case "product_deleted": {
                const deletedProductId = data?.sync_product?.id;
                if (!deletedProductId) {
                    console.warn("[Webhook] Missing sync_product.id in delete payload");
                    break;
                }

                await deactivateProductFromWebhook(deletedProductId);

                await prisma.syncLog.updateMany({
                    where: {
                        triggerType: "WEBHOOK",
                        status: "RUNNING",
                    },
                    data: {
                        status: "SUCCESS",
                        completedAt: new Date(),
                        deletedCount: 1,
                    },
                });
                break;
            }

            case "stock_updated": {
                // stock_updated provides product IDs with updated stock info
                // For print-on-demand, this typically means a product became temporarily unavailable
                const productId = data?.product?.id;
                if (productId) {
                    // Re-sync the product to get updated availability
                    try {
                        await syncSingleProductFromWebhook(productId);
                    } catch {
                        console.warn(`[Webhook] stock_updated: could not sync product ${productId}`);
                    }
                }
                break;
            }

            default:
                console.log(`[Webhook] Unhandled event type: ${eventType}`);
        }

        // Always return 200 to prevent Printful from retrying
        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error: any) {
        console.error("[Webhook] Error processing webhook:", error);

        // Still return 200 to avoid infinite retries for non-transient errors
        // Log the error for investigation
        try {
            await prisma.syncLog.create({
                data: {
                    status: "FAILED",
                    triggerType: "WEBHOOK",
                    completedAt: new Date(),
                    errorMessage: error.message?.substring(0, 2000),
                },
            });
        } catch {
            // If even logging fails, just return 200
        }

        return NextResponse.json({ received: true, error: true }, { status: 200 });
    }
}
