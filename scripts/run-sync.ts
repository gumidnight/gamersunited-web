/**
 * Direct Sync Script — bypasses auth, runs sync engine directly
 * 
 * Run with: npx tsx scripts/run-sync.ts
 */

import "dotenv/config";

// Use the same Prisma setup as the main app
import { prisma } from "../lib/prisma";
import {
    getPrintfulProducts,
    parseVariantAttributes,
    extractProductImages,
    extractVariantImages,
    setupWebhooks,
    type PrintfulProductDetail,
} from "../services/printful";

async function syncProduct(
    pd: PrintfulProductDetail,
    validProductIds: string[],
    validVariantIds: string[],
    stats: { variantCount: number; createdCount: number; updatedCount: number }
) {
    const p = pd.sync_product;
    const variants = pd.sync_variants;

    if (!p || !variants || variants.length === 0) return;
    validProductIds.push(p.id.toString());

    const productImages = extractProductImages(p, variants);
    const imageUrls = productImages.map((img) => img.url);
    const minPrice = Math.min(...variants.map((v) => parseFloat(v.retail_price) || 0));
    const catalogProductId = variants[0]?.product?.product_id ?? null;

    const existing = await prisma.product.findUnique({
        where: { providerId: p.id.toString() },
        select: { id: true, manualOverride: true },
    });

    const baseData = {
        price: minPrice,
        image: p.thumbnail_url || null,
        images: imageUrls,
        printfulProductId: catalogProductId,
        isActive: true,
        lastSyncedAt: new Date(),
    };

    const updateData = existing?.manualOverride
        ? baseData
        : { ...baseData, title: p.name, description: p.name };

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

    if (existing) stats.updatedCount++;
    else stats.createdCount++;

    // Product images
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

    // Variants
    for (const v of variants) {
        validVariantIds.push(v.id.toString());
        stats.variantCount++;

        const { color, size } = parseVariantAttributes(v);
        const variantImages = extractVariantImages(v);

        let variantMainImage = p.thumbnail_url || null;
        const previewImg = variantImages.find((img) => img.type === "preview");
        if (previewImg) variantMainImage = previewImg.url;

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
            create: { providerId: v.id.toString(), ...variantData },
        });

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
    }

    console.log(`  ✓ ${p.name} — ${variants.length} variants, min €${minPrice.toFixed(2)}`);
}

async function runSync() {
    console.log("═══════════════════════════════════════════════════════");
    console.log("  Printful Product Sync — Direct Run");
    console.log("═══════════════════════════════════════════════════════\n");

    const syncLog = await prisma.syncLog.create({
        data: { status: "RUNNING", triggerType: "MANUAL" },
    });

    const stats = { productCount: 0, variantCount: 0, createdCount: 0, updatedCount: 0, deletedCount: 0 };

    try {
        console.log("📡 Fetching products from Printful...\n");
        const productsDetails = await getPrintfulProducts();
        console.log(`\n✅ Fetched ${productsDetails.length} products. Syncing...\n`);

        const validProductIds: string[] = [];
        const validVariantIds: string[] = [];

        for (const pd of productsDetails) {
            await syncProduct(pd, validProductIds, validVariantIds, stats);
            stats.productCount++;
        }

        // Deactivate missing
        if (validProductIds.length > 0) {
            const dp = await prisma.product.updateMany({
                where: { providerId: { notIn: validProductIds }, isActive: true },
                data: { isActive: false },
            });
            const dv = await prisma.variant.updateMany({
                where: { providerId: { notIn: validVariantIds }, isActive: true },
                data: { isActive: false },
            });
            stats.deletedCount = dp.count;
            if (dp.count > 0) console.log(`  ⚠ Deactivated ${dp.count} products, ${dv.count} variants`);
        }

        await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: { status: "SUCCESS", completedAt: new Date(), ...stats },
        });

        console.log("\n═══════════════════════════════════════════════════════");
        console.log("  ✅ Sync Complete!");
        console.log("═══════════════════════════════════════════════════════");
        console.log(`  📦 ${stats.productCount} products (${stats.createdCount} new, ${stats.updatedCount} updated)`);
        console.log(`  🎨 ${stats.variantCount} variants`);
        console.log(`  🗑️  ${stats.deletedCount} deactivated\n`);

    } catch (error: any) {
        console.error("\n❌ Sync failed:", error.message);
        await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: { status: "FAILED", completedAt: new Date(), errorMessage: error.message?.substring(0, 2000), ...stats },
        });
        throw error;
    }
}

async function registerWebhooks() {
    const webhookUrl = (process.env.NEXTAUTH_URL || process.env.AUTH_URL || "").replace(/\/$/, "") + "/api/webhooks/printful";
    console.log(`📡 Registering webhooks → ${webhookUrl}\n`);
    try {
        const result = await setupWebhooks(webhookUrl);
        console.log("✅ Webhooks registered:", JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error("⚠️  Webhook registration failed:", err.message);
        console.log("   Register manually from Printful dashboard.\n");
    }
}

async function main() {
    await registerWebhooks();
    await runSync();
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
