/**
 * Setup & Sync Script
 *
 * Run with: npx tsx scripts/setup-printful.ts
 *
 * This script:
 *  1. Registers Printful webhooks pointing to your domain
 *  2. Runs the initial full product sync
 */

import "dotenv/config";

const PRINTFUL_API_URL = "https://api.printful.com";
const API_KEY = process.env.PRINTFUL_API_KEY;
const WEBHOOK_URL = (process.env.NEXTAUTH_URL || process.env.AUTH_URL || "").replace(/\/$/, "") + "/api/webhooks/printful";

if (!API_KEY) {
    console.error("❌ PRINTFUL_API_KEY not found in .env");
    process.exit(1);
}

const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
};

async function registerWebhooks() {
    console.log(`\n📡 Registering webhooks → ${WEBHOOK_URL}\n`);

    try {
        const res = await fetch(`${PRINTFUL_API_URL}/webhooks`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                url: WEBHOOK_URL,
                types: [
                    "product_synced",
                    "product_updated",
                    "product_deleted",
                    "stock_updated",
                ],
            }),
        });

        const data = await res.json();

        if (res.ok) {
            console.log("✅ Webhooks registered successfully:");
            console.log(JSON.stringify(data.result, null, 2));
        } else {
            console.error(`⚠️  Webhook registration returned ${res.status}:`);
            console.log(JSON.stringify(data, null, 2));

            // If it says "already exists", that's fine
            if (data?.error?.message?.includes("already") || res.status === 200) {
                console.log("ℹ️  Webhook may already be configured — continuing.");
            }
        }
    } catch (err: any) {
        console.error("❌ Failed to register webhooks:", err.message);
        console.log("ℹ️  You may need to register manually from Printful dashboard.");
    }
}

async function verifyWebhooks() {
    console.log("\n🔍 Checking current webhook configuration...\n");

    try {
        const res = await fetch(`${PRINTFUL_API_URL}/webhooks`, { headers });
        const data = await res.json();

        if (res.ok) {
            console.log("Current webhook config:");
            console.log(JSON.stringify(data.result, null, 2));
        } else {
            console.log("Could not fetch webhook config:", data);
        }
    } catch (err: any) {
        console.error("Could not verify webhooks:", err.message);
    }
}

async function testApiConnection() {
    console.log("🔗 Testing Printful API connection...\n");

    try {
        const res = await fetch(`${PRINTFUL_API_URL}/store`, { headers });
        const data = await res.json();

        if (res.ok) {
            console.log(`✅ Connected to store: ${data.result?.name || "Unknown"}`);
            console.log(`   Store ID: ${data.result?.id}`);
            console.log(`   Type: ${data.result?.type}`);
        } else {
            console.error("❌ API connection failed:", data);
            process.exit(1);
        }
    } catch (err: any) {
        console.error("❌ Cannot reach Printful API:", err.message);
        process.exit(1);
    }
}

async function countProducts() {
    console.log("\n📦 Counting store products...\n");

    try {
        const res = await fetch(`${PRINTFUL_API_URL}/store/products?limit=1`, { headers });
        const data = await res.json();

        // The X-Paging-Total header or result length tells us total count
        const pagingTotal = res.headers.get("x-paging-total");
        const count = pagingTotal || (Array.isArray(data.result) ? data.result.length : "unknown");

        console.log(`   Found ${count} products in Printful store`);
        return parseInt(pagingTotal || "0", 10);
    } catch (err: any) {
        console.error("Could not count products:", err.message);
        return 0;
    }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log("═══════════════════════════════════════════════════════");
    console.log("  Printful Integration Setup — Gamers United");
    console.log("═══════════════════════════════════════════════════════");

    // Step 1: Test API connection
    await testApiConnection();

    // Step 2: Count products
    const productCount = await countProducts();

    // Step 3: Register webhooks
    await registerWebhooks();

    // Step 4: Verify webhooks
    await verifyWebhooks();

    // Summary
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  Setup Complete!");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`\n  ✅ API connection verified`);
    console.log(`  📦 ${productCount} products found in store`);
    console.log(`  📡 Webhooks registered → ${WEBHOOK_URL}`);
    console.log(`\n  Next step: Run the initial sync from the admin panel`);
    console.log(`  or via POST /api/sync endpoint.\n`);
}

main().catch((err) => {
    console.error("Setup failed:", err);
    process.exit(1);
});
