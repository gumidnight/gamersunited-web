/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * POST /api/webhooks/cj
 *
 * Handles incoming webhook events from CJ Dropshipping.
 * Updates order status and tracking information.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SupplierRegistry } from "@/services/suppliers/registry";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Optional: Verify webhook signature
        // CJ uses a simple token-based verification
        const webhookToken = request.headers.get("X-CJ-Webhook-Token");
        if (process.env.CJ_WEBHOOK_SECRET && webhookToken !== process.env.CJ_WEBHOOK_SECRET) {
            console.warn("[CJ Webhook] Invalid webhook token");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log(`[CJ Webhook] Received event:`, JSON.stringify(body).substring(0, 500));

        // Parse through the adapter
        const adapter = SupplierRegistry.get("cj");
        const event = adapter.parseWebhook(body);

        if (event.type === "unknown" || !event.externalOrderId) {
            console.log(`[CJ Webhook] Unhandled event type or missing order ID`);
            return NextResponse.json({ received: true });
        }

        // Find the supplier order
        const supplierOrder = await prisma.supplierOrder.findUnique({
            where: { externalOrderId: event.externalOrderId },
            include: { order: true },
        });

        if (!supplierOrder) {
            console.warn(`[CJ Webhook] No supplier order found for external ID: ${event.externalOrderId}`);
            return NextResponse.json({ received: true });
        }

        // Update supplier order
        const updateData: any = {
            status: event.status,
        };

        if (event.trackingNumber) {
            updateData.trackingNumber = event.trackingNumber;
        }
        if (event.trackingUrl) {
            updateData.trackingUrl = event.trackingUrl;
        }

        await prisma.supplierOrder.update({
            where: { id: supplierOrder.id },
            data: updateData,
        });

        // Check if all supplier orders for this order are complete
        const allSupplierOrders = await prisma.supplierOrder.findMany({
            where: { orderId: supplierOrder.orderId },
        });

        const allShipped = allSupplierOrders.every(
            (so) => so.status === "shipped" || so.status === "delivered" || so.status === "COMPLETED"
        );

        if (allShipped) {
            await prisma.order.update({
                where: { id: supplierOrder.orderId },
                data: { status: "SHIPPED" },
            });
        }

        // TODO: Send customer notification email via Resend or similar
        // if (event.trackingNumber) {
        //     await sendTrackingEmail(supplierOrder.order, event);
        // }

        console.log(
            `[CJ Webhook] Updated order ${supplierOrder.orderId}: status=${event.status}, tracking=${event.trackingNumber || "none"}`
        );

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("[CJ Webhook] Error:", error);
        return NextResponse.json({ received: true, error: true }, { status: 200 });
    }
}
