import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products
 *
 * List all active products with their variants, images, and mockups.
 * Supports pagination via `offset` and `limit` query params.
 *
 * Query params:
 *   - offset (default: 0)
 *   - limit (default: 50, max: 100)
 *   - search (optional text search on title)
 */
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10));
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
        const search = url.searchParams.get("search")?.trim() || undefined;

        const where: any = { isActive: true };
        if (search) {
            where.title = { contains: search, mode: "insensitive" };
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
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
                        select: { rating: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: offset,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        // Transform to include average rating
        const result = products.map((p) => ({
            ...p,
            averageRating:
                p.reviews.length > 0
                    ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
                    : null,
            reviewCount: p.reviews.length,
            reviews: undefined, // Don't leak individual ratings in list view
        }));

        return NextResponse.json({
            data: result,
            paging: {
                total,
                offset,
                limit,
                hasMore: offset + limit < total,
            },
        });
    } catch (error: any) {
        console.error("[API] GET /products error:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}
