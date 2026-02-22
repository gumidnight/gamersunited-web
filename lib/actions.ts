'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function postComment(postId: string, content: string) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("You must be logged in to post a comment.")
    }

    if (!content || content.trim().length === 0) {
        throw new Error("Comment content cannot be empty.")
    }

    try {
        await prisma.comment.create({
            data: {
                content,
                userId: session.user.id,
                postId,
            }
        })

        revalidatePath(`/news/[slug]`)
        return { success: true }
    } catch (error) {
        console.error("Error posting comment:", error)
        return { success: false, error: "Failed to post comment." }
    }
}
