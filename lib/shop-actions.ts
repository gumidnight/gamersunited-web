'use server'

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
    getPrintfulProducts,
    getPrintfulProduct,
    parseVariantAttributes,
    extractProductImages,
    extractVariantImages,
    type PrintfulProductDetail,
} from "@/services/printful";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// ─────────────────────────────────────────────────────────────────────────────
// Core Sync Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full sync of all Printful store products into the local database.
 *
 * Idempotent: can be run multiple times safely.
 * Uses upsert pattern keyed on `providerId` (Printful sync product/variant ID).
 *
 * Manual Override: products with `manualOverride: true` keep their title/description
 * but still receive price, image, variant, and isActive updates.
 *
 * @param triggerType - "MANUAL" | "WEBHOOK" | "CRON" — for audit logging
 */
export async function syncPrintfulProducts(triggerType: string = "MANUAL") {
    const session = await auth();
    if (triggerType === "MANUAL") {
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            throw new Error("Unauthorized: Admin access required.");
        }
    }

    // Create sync log entry
    const syncLog = await prisma.syncLog.create({
        data: { status: "RUNNING", triggerType },
    });

    const stats = {
        productCount: 0,
        variantCount: 0,
        createdCount: 0,
        updatedCount: 0,
        deletedCount: 0,
    };

    try {
        const productsDetails = await getPrintfulProducts();
        const validProductProviderIds: string[] = [];
        const validVariantProviderIds: string[] = [];

        for (const pd of productsDetails) {
            await syncSingleProduct(pd, validProductProviderIds, validVariantProviderIds, stats);
        }

        // ─── Deactivate products NOT in Printful response ─────────────────
        if (validProductProviderIds.length > 0) {
            // Deactivate orphaned variants
            const deactivatedVariants = await prisma.variant.updateMany({
                where: {
                    product: { supplierType: "printful" },
                    providerId: { notIn: validVariantProviderIds },
                    isActive: true,
                    NOT: {
                        providerId: { startsWith: 'CUSTOM-VAR-' }
                    }
                },
                data: { isActive: false },
            });

            // Deactivate orphaned products
            const deactivatedProducts = await prisma.product.updateMany({
                where: {
                    supplierType: "printful",
                    providerId: { notIn: validProductProviderIds },
                    isActive: true,
                    manualOverride: false, // Don't deactivate products marked for manual management
                    NOT: {
                        providerId: { startsWith: 'CUSTOM-' }
                    }
                },
                data: { isActive: false },
            });

            stats.deletedCount = deactivatedProducts.count;
            console.log(
                `[Sync] Deactivated ${deactivatedProducts.count} products, ${deactivatedVariants.count} variants`
            );
        } else if (productsDetails.length === 0) {
            // If Printful returned zero products, deactivate only printful products
            // (never touch CJ/manual products in this code path).
            await prisma.product.updateMany({
                where: {
                    supplierType: "printful",
                    isActive: true,
                    manualOverride: false,
                    NOT: { providerId: { startsWith: 'CUSTOM-' } }
                },
                data: { isActive: false },
            });
            console.warn("[Sync] Printful returned 0 products — managed products deactivated.");
        }

        stats.productCount = productsDetails.length;

        // Update sync log
        await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: {
                status: "SUCCESS",
                completedAt: new Date(),
                ...stats,
            },
        });

        revalidatePath("/shop");
        revalidatePath("/admin/shop");
        return { success: true, ...stats };
    } catch (error: any) {
        console.error("[Sync] Fatal error:", error);

        // Mark sync as failed
        await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: {
                status: "FAILED",
                completedAt: new Date(),
                errorMessage: error.message?.substring(0, 2000),
                ...stats,
            },
        });

        throw new Error(`Sync failed: ${error.message}`);
    }
}

/**
 * Sync a single product and its variants into the database.
 * Called during full sync and webhook-triggered updates.
 */
async function syncSingleProduct(
    pd: PrintfulProductDetail,
    validProductIds: string[],
    validVariantIds: string[],
    stats: { variantCount: number; createdCount: number; updatedCount: number }
) {
    const p = pd.sync_product;
    const variants = pd.sync_variants;

    if (!p || !variants || variants.length === 0) return;
    validProductIds.push(p.id.toString());

    // Collect all unique product-level images
    const productImages = extractProductImages(p, variants);
    const imageUrls = productImages.map((img) => img.url);

    // Find lowest price among variants
    const minPrice = Math.min(
        ...variants.map((v) => parseFloat(v.retail_price) || 0)
    );

    // Extract catalog product ID from first variant
    const catalogProductId = variants[0]?.product?.product_id ?? null;

    // Check if product already exists (for stats tracking)
    const existing = await prisma.product.findUnique({
        where: { providerId: p.id.toString() },
        select: { id: true, manualOverride: true, title: true, description: true },
    });

    // Build update/create data
    // Get high-res images from all variants as pool
    const variantImages = variants.flatMap(v => extractVariantImages(v));
    const previewImg = variantImages.find(img => img.type === "preview" || img.type === "mockup");

    // Choose the best main image
    const mainProductImage = previewImg ? previewImg.url : (p.thumbnail_url || null);

    const baseData = {
        price: minPrice,
        image: mainProductImage,
        images: Array.from(new Set(variantImages.map(img => img.url))),
        printfulProductId: catalogProductId,
        isActive: true,
        lastSyncedAt: new Date(),
    };

    // If manual override, preserve title/description
    const updateData = existing?.manualOverride
        ? baseData
        : {
            ...baseData,
            title: p.name,
            description: p.name, // Will be enhanced with catalog description if available
        };

    const product = await prisma.product.upsert({
        where: { providerId: p.id.toString() },
        update: updateData,
        create: {
            providerId: p.id.toString(),
            title: p.name,
            description: p.name,
            ...baseData,
        },
    });

    if (existing) {
        stats.updatedCount++;
    } else {
        stats.createdCount++;
    }

    // ─── Sync product images ─────────────────────────────────────────
    // Delete existing images and recreate (simpler than diffing)
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    if (productImages.length > 0) {
        await prisma.productImage.createMany({
            data: productImages.map((img, i) => ({
                productId: product.id,
                url: img.url,
                type: img.type,
                sortOrder: i,
            })),
            skipDuplicates: true,
        });
    }

    // ─── Sync variants ───────────────────────────────────────────────
    const BATCH_SIZE = 5;
    for (let i = 0; i < variants.length; i += BATCH_SIZE) {
        const batch = variants.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (v) => {
            validVariantIds.push(v.id.toString());
            stats.variantCount++;

            const { color, size } = parseVariantAttributes(v);
            const variantImages = extractVariantImages(v);

            let variantMainImage = p.thumbnail_url || null;
            const previewImg = variantImages.find((img) => img.type === "preview" || img.type === "mockup");
            if (previewImg) {
                variantMainImage = previewImg.url;
            }

            const variantData = {
                productId: product.id,
                title: v.name,
                price: parseFloat(v.retail_price) || 0,
                stock: 999,
                printfulVariantId: v.variant_id ?? v.product?.variant_id ?? null,
                color,
                size,
                sku: v.sku || null,
                image: variantMainImage,
                images: variantImages.map((img) => img.url),
                isActive: true,
                lastSyncedAt: new Date(),
            };

            const variant = await prisma.variant.upsert({
                where: { providerId: v.id.toString() },
                update: variantData,
                create: {
                    providerId: v.id.toString(),
                    ...variantData,
                },
            });

            // Sync variant images
            await prisma.variantImage.deleteMany({ where: { variantId: variant.id } });
            if (variantImages.length > 0) {
                await prisma.variantImage.createMany({
                    data: variantImages.map((img, i) => ({
                        variantId: variant.id,
                        url: img.url,
                        type: img.type,
                        sortOrder: i,
                    })),
                    skipDuplicates: true,
                });
            }
        }));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook-triggered Sync (for a single product)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle a product update/sync webhook by re-fetching and upserting a single product.
 * Does NOT require authentication — called from webhook handler.
 */
export async function syncSingleProductFromWebhook(printfulProductId: number) {
    try {
        const pd = await getPrintfulProduct(printfulProductId);
        const dummyProductIds: string[] = [];
        const dummyVariantIds: string[] = [];
        const stats = { variantCount: 0, createdCount: 0, updatedCount: 0 };

        await syncSingleProduct(pd, dummyProductIds, dummyVariantIds, stats);

        console.log(
            `[Webhook Sync] Product ${printfulProductId} synced (${stats.variantCount} variants)`
        );

        revalidatePath("/shop");
        return { success: true };
    } catch (error: any) {
        console.error(`[Webhook Sync] Failed for product ${printfulProductId}:`, error);
        throw error;
    }
}

/**
 * Handle a product deletion webhook by deactivating the product.
 */
export async function deactivateProductFromWebhook(printfulProductId: number) {
    try {
        await prisma.product.updateMany({
            where: { providerId: printfulProductId.toString() },
            data: { isActive: false },
        });

        await prisma.variant.updateMany({
            where: {
                product: { providerId: printfulProductId.toString() },
            },
            data: { isActive: false },
        });

        console.log(`[Webhook] Product ${printfulProductId} deactivated`);
        revalidatePath("/shop");
        return { success: true };
    } catch (error: any) {
        console.error(`[Webhook] Deactivation failed for ${printfulProductId}:`, error);
        throw error;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkout (Stripe Integration)
// ─────────────────────────────────────────────────────────────────────────────

import { stripe } from "./stripe";

export async function createCheckoutSession(variantId: string) {
    return createCartCheckoutSession([{ variantId, quantity: 1 }]);
}

export async function createCartCheckoutSession(items: { variantId: string, quantity: number }[]) {
    const session = await auth();

    try {
        const headersList = await headers();
        const origin = headersList.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

        // Fetch all variants with product + supplier info
        const dbVariants = await prisma.variant.findMany({
            where: { id: { in: items.map(i => i.variantId) } },
            include: { product: true }
        });

        if (dbVariants.length === 0) {
            throw new Error("No products found");
        }

        // ── Pre-checkout stock validation for dropship products ──────────
        const stockErrors: string[] = [];
        for (const item of items) {
            const variant = dbVariants.find(v => v.id === item.variantId);
            if (!variant) continue;

            // Printful is POD (stock=999), skip validation
            if (variant.product.supplierType === "printful") continue;

            // Check real stock for dropship products
            if (variant.stock < item.quantity) {
                stockErrors.push(
                    `"${variant.product.title} - ${variant.title}" has only ${variant.stock} in stock (requested ${item.quantity})`
                );
            }
        }

        if (stockErrors.length > 0) {
            throw new Error(`Insufficient stock:\n${stockErrors.join("\n")}`);
        }

        const lineItems = items.map(item => {
            const variant = dbVariants.find(v => v.id === item.variantId);
            if (!variant) return null;
            if (!variant.isActive || !variant.product.isActive) return null;

            return {
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: `${variant.product.title} - ${variant.title}`,
                        description: variant.product.description.replace(/<[^>]*>?/gm, '').substring(0, 255),
                        images: variant.product.image ? [variant.product.image] : [],
                        metadata: {
                            // Both IDs for backward compat + new routing
                            printful_variant_id: variant.providerId,
                            variant_db_id: variant.id,
                            supplier_type: variant.product.supplierType,
                        }
                    },
                    unit_amount: Math.round(variant.price * 100),
                },
                quantity: item.quantity,
            };
        }).filter(Boolean);

        if (lineItems.length === 0) {
            throw new Error("All items are currently unavailable.");
        }

        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems as any,
            mode: "payment",
            success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/shop/cart`,
            customer_email: session?.user?.email || undefined,
            metadata: {
                userId: session?.user?.id || "guest",
                variantIds: dbVariants.map(v => v.providerId).join(','),
                productIds: dbVariants.map(v => v.productId).join(','),
                supplierTypes: [...new Set(dbVariants.map(v => v.product.supplierType))].join(','),
            },
            shipping_address_collection: {
                allowed_countries: ["CY", "GR", "GB", "DE", "FR", "IT", "ES"],
            },
        });

        return { url: stripeSession.url };
    } catch (error: any) {
        console.error("Checkout error:", error);
        throw new Error(`Checkout failed: ${error.message}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reviews
// ─────────────────────────────────────────────────────────────────────────────

export async function postProductReview(productId: string, rating: number, content: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("You must be logged in to leave a review.");
    }

    if (!rating || rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5.");
    }

    try {
        await prisma.review.create({
            data: {
                rating,
                content,
                userId: session.user.id,
                productId,
            }
        });

        revalidatePath(`/shop/${productId}`);
        revalidatePath("/shop");
        return { success: true };
    } catch (error) {
        console.error("Error posting review:", error);
        return { success: false, error: "Failed to post review." };
    }
}
