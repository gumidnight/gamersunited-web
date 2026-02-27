/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Inventory Sync Service
 *
 * Runs on a schedule (cron or manual trigger) to:
 *   1. Fetch current stock levels from each supplier
 *   2. Update local database
 *   3. Auto-disable out-of-stock products
 *   4. Log price changes
 *
 * This service only handles inventory updates, NOT product imports.
 * Product imports are handled by the full sync in shop-actions.ts
 */

import { prisma } from "@/lib/prisma";
import { SupplierRegistry } from "@/services/suppliers/registry";
import { isPriceChangeSignificant } from "@/lib/pricing";

/**
 * Sync inventory for all active suppliers.
 */
export async function syncAllInventory() {
    const suppliers = await prisma.supplier.findMany({
        where: { isActive: true },
    });

    const results: Record<string, { updated: number; disabled: number; errors: number }> = {};

    for (const supplier of suppliers) {
        try {
            const result = await syncSupplierInventory(supplier.slug);
            results[supplier.slug] = result;
        } catch (err: any) {
            console.error(`[InventorySync] Failed for ${supplier.slug}:`, err);
            results[supplier.slug] = { updated: 0, disabled: 0, errors: 1 };
        }
    }

    return results;
}

/**
 * Sync inventory for a single supplier.
 */
export async function syncSupplierInventory(supplierSlug: string) {
    if (!SupplierRegistry.has(supplierSlug)) {
        throw new Error(`No adapter for supplier: ${supplierSlug}`);
    }

    // Skip Printful — it's POD with infinite stock
    if (supplierSlug === "printful") {
        return { updated: 0, disabled: 0, errors: 0 };
    }

    const adapter = SupplierRegistry.get(supplierSlug);

    // Get all active variants for this supplier
    const variants = await prisma.variant.findMany({
        where: {
            product: { supplierType: supplierSlug },
            isActive: true,
        },
        select: {
            id: true,
            providerId: true,
            stock: true,
            costPrice: true,
            price: true,
            productId: true,
        },
    });

    if (variants.length === 0) {
        return { updated: 0, disabled: 0, errors: 0 };
    }

    // Fetch inventory from supplier
    const externalIds = variants.map((v) => v.providerId);
    const inventoryItems = await adapter.getInventory(externalIds);

    // Build lookup
    const inventoryMap = new Map(
        inventoryItems.map((i) => [i.externalVariantId, i])
    );

    let updated = 0;
    let disabled = 0;
    let errors = 0;

    for (const variant of variants) {
        const inventory = inventoryMap.get(variant.providerId);

        if (!inventory) {
            // Variant not found in supplier response — might be discontinued
            console.warn(`[InventorySync] Variant ${variant.providerId} not found in ${supplierSlug} response`);
            continue;
        }

        try {
            const updates: any = {};
            const logs: Array<{ field: string; oldValue: string; newValue: string }> = [];

            // Stock change
            if (inventory.stock !== variant.stock) {
                logs.push({
                    field: "stock",
                    oldValue: variant.stock.toString(),
                    newValue: inventory.stock.toString(),
                });
                updates.stock = inventory.stock;

                // Auto-disable if out of stock
                if (inventory.stock === 0) {
                    updates.isActive = false;
                    disabled++;
                    logs.push({
                        field: "isActive",
                        oldValue: "true",
                        newValue: "false",
                    });
                }
            }

            // Cost price change
            if (
                inventory.costPrice !== undefined &&
                variant.costPrice !== null &&
                isPriceChangeSignificant(variant.costPrice, inventory.costPrice)
            ) {
                logs.push({
                    field: "costPrice",
                    oldValue: (variant.costPrice ?? 0).toString(),
                    newValue: inventory.costPrice.toString(),
                });
                updates.costPrice = inventory.costPrice;
            }

            // Apply updates
            if (Object.keys(updates).length > 0) {
                updates.lastSyncedAt = new Date();

                await prisma.variant.update({
                    where: { id: variant.id },
                    data: updates,
                });
                updated++;

                // Write inventory logs
                if (logs.length > 0) {
                    await prisma.inventoryLog.createMany({
                        data: logs.map((log) => ({
                            productId: variant.productId,
                            variantId: variant.id,
                            field: log.field,
                            oldValue: log.oldValue,
                            newValue: log.newValue,
                            source: "cron",
                        })),
                    });
                }
            }
        } catch (err) {
            console.error(`[InventorySync] Error updating variant ${variant.id}:`, err);
            errors++;
        }
    }

    // Check if any products should be disabled (all variants out of stock)
    const productsToCheck = [...new Set(variants.map((v) => v.productId))];
    for (const productId of productsToCheck) {
        const activeVariants = await prisma.variant.count({
            where: { productId, isActive: true, stock: { gt: 0 } },
        });

        if (activeVariants === 0) {
            await prisma.product.update({
                where: { id: productId },
                data: { isActive: false },
            });

            await prisma.inventoryLog.create({
                data: {
                    productId,
                    field: "isActive",
                    oldValue: "true",
                    newValue: "false",
                    source: "cron",
                },
            });
        }
    }

    console.log(
        `[InventorySync] ${supplierSlug}: ${updated} updated, ${disabled} disabled, ${errors} errors`
    );

    return { updated, disabled, errors };
}
