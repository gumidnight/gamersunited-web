import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncSpecificDropshipProduct } from "@/services/inventory/dropship-sync";

/**
 * POST /api/admin/products/import
 *
 * Import a single product from a dropship supplier by its PID/ID.
 * Body: { pid: string, supplier: string }
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        // Check for admin role
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized: Admin access required" },
                { status: 401 }
            );
        }

        const { pid, supplier } = await req.json();

        if (!pid || !supplier) {
            return NextResponse.json(
                { error: "PID and supplier slug are required" },
                { status: 400 }
            );
        }

        const result = await syncSpecificDropshipProduct(supplier, pid);

        return NextResponse.json({
            success: true,
            message: `Product ${pid} imported successfully from ${supplier}`,
            data: result,
        });
    } catch (error: any) {
        console.error("[API] POST /api/admin/products/import error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to import product",
            },
            { status: 500 }
        );
    }
}
