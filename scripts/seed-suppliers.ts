/**
 * Seed script — creates Supplier records and backfills existing products
 * Run: DATABASE_URL="..." npx tsx scripts/seed-suppliers.ts
 */
import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

// Allow self-signed certs for local dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

if (typeof WebSocket === "undefined") {
    try {
        neonConfig.webSocketConstructor = require("ws");
    } catch {
        // ws not available
    }
}

const connectionString = process.env.DATABASE_URL!;
neonConfig.poolQueryViaFetch = true;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🔌 Connected to database");

    // Create supplier records
    const printful = await prisma.supplier.upsert({
        where: { slug: "printful" },
        update: {},
        create: { name: "Printful", slug: "printful", isActive: true },
    });
    console.log("✅ Printful supplier:", printful.id);

    const cj = await prisma.supplier.upsert({
        where: { slug: "cj" },
        update: {},
        create: { name: "CJ Dropshipping", slug: "cj", isActive: true },
    });
    console.log("✅ CJ supplier:", cj.id);

    // Backfill existing products with printful supplier
    const updated = await prisma.product.updateMany({
        where: { supplierId: null },
        data: { supplierId: printful.id, supplierType: "printful" },
    });
    console.log(`✅ Backfilled ${updated.count} existing products → Printful`);

    // Verify
    const products = await prisma.product.findMany({
        select: { id: true, title: true, supplierType: true, supplierId: true },
    });
    console.log(`\n📦 Products (${products.length}):`);
    for (const p of products) {
        console.log(`   ${p.supplierType === "printful" ? "🖨️" : "📦"} ${p.title} → ${p.supplierType} ${p.supplierId ? "✓" : "✗"}`);
    }

    // Show suppliers
    const suppliers = await prisma.supplier.findMany();
    console.log(`\n🏭 Suppliers (${suppliers.length}):`);
    for (const s of suppliers) {
        console.log(`   ${s.isActive ? "✅" : "❌"} ${s.name} (${s.slug})`);
    }

    await prisma.$disconnect();
    console.log("\n✨ Done!");
}

main().catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
});
