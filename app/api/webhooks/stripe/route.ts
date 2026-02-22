/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createPrintifyOrder } from "@/services/printify";
import { prisma } from "@/lib/prisma"; // If you need to store metadata

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
        apiVersion: "2023-10-16" as any,
    });

    const payload = await req.text();
    const signature = req.headers.get("Stripe-Signature") as string;
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle successful checkout
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        // Expand the line items to know what to fulfill
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["line_items", "customer_details"],
        });

        const items = fullSession.line_items?.data.map((item) => ({
            product_id: item.price?.product, // Should map to Printify product ID/variant
            variant_id: item.price?.metadata?.printify_variant_id, // Recommended to store Printify IDs in Stripe Price Metadata
            quantity: item.quantity,
        }));

        const shipping = (fullSession as any).shipping_details?.address;
        const nameSplit = (fullSession as any).shipping_details?.name?.split(" ") || ["", ""];
        const firstName = nameSplit[0];
        const lastName = nameSplit.slice(1).join(" ");

        try {
            // Create Printify order mapped payload
            const printifyOrderData = {
                external_id: session.id,
                items,
                customer: {
                    email: fullSession.customer_details?.email,
                },
                shipping: {
                    first_name: firstName,
                    last_name: lastName || firstName, // Last name usually required
                    email: fullSession.customer_details?.email,
                    phone: fullSession.customer_details?.phone || "",
                    country: shipping?.country,
                    state: shipping?.state,
                    address1: shipping?.line1,
                    address2: shipping?.line2 || "",
                    city: shipping?.city,
                    zip: shipping?.postal_code,
                },
            };

            // Push order to Printify
            await createPrintifyOrder(printifyOrderData);

            // (Optional) Store order locally for reference
            // await prisma.order.create({ ... })

            // Note: Send confirmation email here using Resend or similar service.

            return NextResponse.json({ success: true, message: "Order processed and sent to Printify" }, { status: 200 });

        } catch (e: any) {
            console.error("Printify Fulfillment Error:", e);
            // Depending on your strategy, you might want to return 500 to tell Stripe to retry
            // Or 200 and handle the dead-letter queue via DB log.
            // Re-throwing causes Stripe to retry the webhook delivery.
            return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
        }
    }

    // Acknowledge other event types to Stripe
    return NextResponse.json({ received: true });
}
