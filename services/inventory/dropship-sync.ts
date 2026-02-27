/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Dropship Product Sync — imports products from any supplier adapter
 *
 * This is the counterpart to the existing Printful sync in shop-actions.ts.
 * It uses the abstract SupplierAdapter interface so it works with CJ,
 * or any future supplier.
 */

import { prisma } from "@/lib/prisma";
import { SupplierRegistry } from "@/services/suppliers/registry";
import { calculateSalePrice } from "@/lib/pricing";
import { revalidatePath } from "next/cache";
import type { NormalizedProduct } from "@/services/suppliers/types";

/**
 * Sync a single specific product from a supplier by its external ID.
 *
 * @param supplierSlug - "cj", etc.
 * @param externalId - The PID or supplier-specific product ID
 */
export async function syncSpecificDropshipProduct(
    supplierSlug: string,
    externalId: string
) {
    if (!SupplierRegistry.has(supplierSlug)) {
        throw new Error(`No adapter registered for supplier: ${supplierSlug}`);
    }

    const adapter = SupplierRegistry.get(supplierSlug);
    const np = await adapter.fetchSingleProduct(externalId);

    if (!np) {
        throw new Error(`Product not found with ID: ${externalId} at ${supplierSlug}`);
    }

    // Get or create supplier record
    let supplier = await prisma.supplier.findUnique({
        where: { slug: supplierSlug },
    });

    if (!supplier) {
        supplier = await prisma.supplier.create({
            data: {
                name: adapter.displayName,
                slug: supplierSlug,
                isActive: true,
            },
        });
    }

    const stats = {
        variantCount: 0,
        createdCount: 0,
        updatedCount: 0,
    };

    await upsertDropshipProduct(np, supplier.id, supplierSlug, stats);

    revalidatePath("/shop");
    revalidatePath("/admin/shop");

    return {
        success: true,
        productId: externalId,
        ...stats,
    };
}

/**
 * Full sync of products from a specific supplier.
 *
 * @param supplierSlug - Which supplier to sync (e.g., "cj")
 * @param triggerType - "MANUAL" | "CRON" | "WEBHOOK"
 */
export async function syncDropshipProducts(
    supplierSlug: string,
    triggerType: string = "MANUAL"
) {
    if (!SupplierRegistry.has(supplierSlug)) {
        throw new Error(`No adapter registered for supplier: ${supplierSlug}`);
    }

    // Get or create supplier record
    let supplier = await prisma.supplier.findUnique({
        where: { slug: supplierSlug },
    });

    if (!supplier) {
        supplier = await prisma.supplier.create({
            data: {
                name: SupplierRegistry.get(supplierSlug).displayName,
                slug: supplierSlug,
                isActive: true,
            },
        });
    }

    // Create sync log
    const syncLog = await prisma.syncLog.create({
        data: {
            status: "RUNNING",
            triggerType,
            supplierSlug,
        },
    });

    const stats = {
        productCount: 0,
        variantCount: 0,
        createdCount: 0,
        updatedCount: 0,
        deletedCount: 0,
    };

    try {
        const adapter = SupplierRegistry.get(supplierSlug);
        const products = await adapter.fetchProducts();
        stats.productCount = products.length;

        const validProviderIds: string[] = [];

        for (const np of products) {
            await upsertDropshipProduct(np, supplier.id, supplierSlug, stats);
            validProviderIds.push(np.externalId);
        }

        // Deactivate products from this supplier that are no longer in the feed
        if (validProviderIds.length > 0) {
            const deactivated = await prisma.product.updateMany({
                where: {
                    supplierType: supplierSlug,
                    providerId: { notIn: validProviderIds },
                    isActive: true,
                },
                data: { isActive: false },
            });
            stats.deletedCount = deactivated.count;
        }

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

        console.log(
            `[DropshipSync] ${supplierSlug}: ${stats.createdCount} created, ${stats.updatedCount} updated, ${stats.deletedCount} deactivated`
        );

        return { success: true, ...stats };
    } catch (err: any) {
        console.error(`[DropshipSync] Fatal error for ${supplierSlug}:`, err);

        await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: {
                status: "FAILED",
                completedAt: new Date(),
                errorMessage: err.message?.substring(0, 2000),
                ...stats,
            },
        });

        throw new Error(`Dropship sync failed: ${err.message}`);
    }
}

/**
 * Upsert a single normalized product into the database.
 */
async function upsertDropshipProduct(
    np: NormalizedProduct,
    supplierId: string,
    supplierSlug: string,
    stats: { variantCount: number; createdCount: number; updatedCount: number }
) {
    // Calculate price from first variant
    const minCost = Math.min(...np.variants.map((v) => v.costPrice));
    const salePrice = calculateSalePrice(minCost, supplierSlug);

    // Check if exists
    const existing = await prisma.product.findUnique({
        where: { providerId: np.externalId },
        select: { id: true, manualOverride: true },
    });

    const mainImage = np.thumbnailUrl || np.images[0] || null;

    const baseData = {
        price: salePrice,
        costPrice: minCost,
        image: mainImage,
        images: np.images,
        supplierId,
        supplierType: supplierSlug,
        isActive: true,
        lastSyncedAt: new Date(),
    };

    const updateData = existing?.manualOverride
        ? baseData
        : {
            ...baseData,
            title: np.title,
            description: np.description,
        };

    const product = await prisma.product.upsert({
        where: { providerId: np.externalId },
        update: updateData,
        create: {
            providerId: np.externalId,
            title: np.title,
            description: np.description,
            ...baseData,
        },
    });

    if (existing) {
        stats.updatedCount++;
    } else {
        stats.createdCount++;
    }

    // Sync product images
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    if (np.images.length > 0) {
        await prisma.productImage.createMany({
            data: np.images.map((url, i) => ({
                productId: product.id,
                url,
                type: i === 0 ? "thumbnail" : "preview",
                sortOrder: i,
            })),
            skipDuplicates: true,
        });
    }

    // Sync variants
    const validVariantIds: string[] = [];

    for (const nv of np.variants) {
        stats.variantCount++;
        validVariantIds.push(nv.externalId);

        const variantSalePrice = calculateSalePrice(nv.costPrice, supplierSlug);

        const variantData = {
            productId: product.id,
            title: nv.title,
            price: variantSalePrice,
            costPrice: nv.costPrice,
            stock: nv.stock,
            color: nv.color,
            size: nv.size,
            sku: nv.sku,
            image: nv.image,
            images: nv.images,
            isActive: nv.stock > 0,
            lastSyncedAt: new Date(),
        };

        await prisma.variant.upsert({
            where: { providerId: nv.externalId },
            update: variantData,
            create: {
                providerId: nv.externalId,
                ...variantData,
            },
        });
    }

    // Deactivate variants that are no longer in the feed
    if (validVariantIds.length > 0) {
        await prisma.variant.updateMany({
            where: {
                productId: product.id,
                providerId: { notIn: validVariantIds },
                isActive: true,
            },
            data: { isActive: false },
        });
    }
}
