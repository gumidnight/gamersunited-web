'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleUserRole(userId: string, currentRole: string) {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    // Prevent demoting yourself (optional but recommended)
    if (session.user.id === userId) {
        throw new Error("You cannot change your own role.")
    }

    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN"

    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole as any }
    })

    revalidatePath("/admin/users")
    return { success: true, newRole }
}
