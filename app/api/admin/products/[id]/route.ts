import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        // Check for admin role
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized: Admin access required" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        // Ensure variables
        const { customImages, description } = body;

        // Perform update
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                customImages: customImages || [],
                description: description || "",
            },
        });

        return NextResponse.json({ data: updatedProduct });
    } catch (error: any) {
        console.error("[API] PUT /admin/products/[id] error:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Soft delete: set isActive to false
        // This hides it from the shop and admin list while preserving orders
        await prisma.product.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[API] DELETE /admin/products/[id] error:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}

