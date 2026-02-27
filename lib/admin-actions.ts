"use server";

import { setupWebhooks, getWebhookConfig } from "@/services/printful";
import { auth } from "@/auth";

export async function registerPrintfulWebhooks() {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gamersunited.cy";
    const webhookUrl = `${baseUrl}/api/webhooks/printful`;

    try {
        const result = await setupWebhooks(webhookUrl);
        return { success: true, result };
    } catch (error: any) {
        console.error("Webhook registration error:", error);
        throw new Error(`Failed to register webhooks: ${error.message}`);
    }
}

export async function checkWebhookStatus() {
    try {
        const config = await getWebhookConfig();
        return config;
    } catch (error) {
        return null;
    }
}
