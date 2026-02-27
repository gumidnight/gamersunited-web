import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
    try {
        const session = await auth();
        // Check for admin role
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized: Admin access required" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { title, description, price, image, variants } = body;

        if (!title || !price) {
            return NextResponse.json(
                { error: "Title and price are required" },
                { status: 400 }
            );
        }

        // Generate a custom providerId
        const timestamp = Date.now();
        const providerId = `CUSTOM-${timestamp}`;

        // Create the product and its variants in a transaction
        const product = await prisma.product.create({
            data: {
                title,
                description: description || "",
                price: parseFloat(price),
                image: image || null,
                providerId,
                isActive: true,
                manualOverride: true, // Mark as manual to prevent sync overrides if any
                variants: {
                    create: (variants || []).map((v: any, index: number) => ({
                        title: v.title || `${title} - Option ${index + 1}`,
                        price: v.price ? parseFloat(v.price) : parseFloat(price),
                        stock: v.stock ? parseInt(v.stock) : 0,
                        color: v.color || null,
                        size: v.size || null,
                        image: v.image || image || null,
                        providerId: `CUSTOM-VAR-${timestamp}-${index}`,
                        isActive: true
                    }))
                }
            },
            include: {
                variants: true
            }
        });

        return NextResponse.json({ data: product });
    } catch (error: any) {
        console.error("[API] POST /api/admin/products error:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}
