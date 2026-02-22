'use server'

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPrintfulProducts } from "@/services/printful";
import { revalidatePath } from "next/cache";

export async function syncPrintfulProducts() {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    try {
        const productsDetails = await getPrintfulProducts();

        for (const pd of productsDetails) {
            const p = pd.sync_product;
            const variants = pd.sync_variants;

            if (!p || !variants || variants.length === 0) continue;

            // Find lowest price among variants
            const minPrice = Math.min(...variants.map((v: any) => parseFloat(v.retail_price)));

            await prisma.product.upsert({
                where: { providerId: p.id.toString() },
                update: {
                    title: p.name,
                    description: p.name, // Printful sync product name
                    price: minPrice,
                    image: p.thumbnail_url || null,
                },
                create: {
                    providerId: p.id.toString(),
                    title: p.name,
                    description: p.name,
                    price: minPrice,
                    image: p.thumbnail_url || null,
                }
            });

            // Sync variants as well
            for (const v of variants) {
                await prisma.variant.upsert({
                    where: { id: v.id.toString() }, // Using Printful sync_variant ID
                    update: {
                        title: v.name,
                        price: parseFloat(v.retail_price),
                        stock: 10 // Mock stock or real if Printful gives it
                    },
                    create: {
                        id: v.id.toString(),
                        productId: (await prisma.product.findUnique({ where: { providerId: p.id.toString() } }))?.id || '',
                        providerId: v.id.toString(),
                        title: v.name,
                        price: parseFloat(v.retail_price),
                        stock: 10
                    }
                }).catch(e => console.error(`Error syncing variant ${v.id}:`, e));
            }
        }

        revalidatePath("/shop");
        revalidatePath("/admin/shop");
        return { success: true, count: productsDetails.length };
    } catch (error: any) {
        console.error("Sync error:", error);
        throw new Error(`Sync failed: ${error.message}`);
    }
}
import { stripe } from "./stripe";

export async function createCheckoutSession(variantId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("You must be logged in to purchase products.");
    }

    try {
        const variant = await prisma.variant.findUnique({
            where: { id: variantId },
            include: { product: true }
        });

        if (!variant) {
            throw new Error("Variant not found");
        }

        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: `${variant.product.title} - ${variant.title}`,
                            description: variant.product.description.replace(/<[^>]*>?/gm, '').substring(0, 255),
                            images: variant.product.image ? [variant.product.image] : [],
                        },
                        unit_amount: Math.round(variant.price * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXTAUTH_URL}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/shop/${variant.productId}`,
            customer_email: session.user.email || undefined,
            metadata: {
                userId: session.user.id || "",
                printfulVariantId: variant.providerId,
                productId: variant.productId,
            },
            shipping_address_collection: {
                allowed_countries: ["CY", "GR", "GB", "DE", "FR", "IT", "ES"], // Cyprus and main EU countries
            },
        });

        return { url: stripeSession.url };
    } catch (error: any) {
        console.error("Checkout error:", error);
        throw new Error(`Checkout failed: ${error.message}`);
    }
}
