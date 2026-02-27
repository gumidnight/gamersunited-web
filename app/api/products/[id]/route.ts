import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products/[id]
 *
 * Product detail with full variant attributes, images, and reviews.
 * Returns 404 if product is not found or inactive.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                variants: {
                    where: { isActive: true },
                    include: {
                        variantImages: {
                            orderBy: { sortOrder: "asc" },
                        },
                    },
                    orderBy: { price: "asc" },
                },
                productImages: {
                    orderBy: { sortOrder: "asc" },
                },
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!product || !product.isActive) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Compute review stats
        const averageRating =
            product.reviews.length > 0
                ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
                : null;

        // Extract unique colors and sizes for filter UI
        const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[];
        const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[];

        return NextResponse.json({
            data: {
                ...product,
                averageRating,
                reviewCount: product.reviews.length,
                availableColors: colors,
                availableSizes: sizes,
            },
        });
    } catch (error: any) {
        console.error("[API] GET /products/[id] error:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}
