import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncPrintfulProducts } from "@/lib/shop-actions";

/**
 * POST /api/sync
 *
 * Trigger a manual sync of all Printful products.
 * Protected: requires ADMIN role.
 *
 * Returns sync statistics on success.
 */
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized: Admin access required" },
                { status: 403 }
            );
        }

        const result = await syncPrintfulProducts("MANUAL");

        return NextResponse.json({
            success: true,
            message: "Sync completed successfully",
            data: result,
        });
    } catch (error: any) {
        console.error("[API] POST /sync error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Sync failed",
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/sync
 *
 * Get the latest sync status and history.
 * Protected: requires ADMIN role.
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized: Admin access required" },
                { status: 403 }
            );
        }

        // Import prisma inline to keep the module tree clean
        const { prisma } = await import("@/lib/prisma");

        const logs = await prisma.syncLog.findMany({
            orderBy: { startedAt: "desc" },
            take: 20,
        });

        const lastSuccess = logs.find((l) => l.status === "SUCCESS");
        const isRunning = logs.some((l) => l.status === "RUNNING");

        return NextResponse.json({
            isRunning,
            lastSync: lastSuccess
                ? {
                    completedAt: lastSuccess.completedAt,
                    productCount: lastSuccess.productCount,
                    variantCount: lastSuccess.variantCount,
                    createdCount: lastSuccess.createdCount,
                    updatedCount: lastSuccess.updatedCount,
                    deletedCount: lastSuccess.deletedCount,
                }
                : null,
            history: logs,
        });
    } catch (error: any) {
        console.error("[API] GET /sync error:", error);
        return NextResponse.json(
            { error: "Failed to fetch sync status" },
            { status: 500 }
        );
    }
}
