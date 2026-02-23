'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createNewsPost(formData: FormData) {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const coverImage = formData.get("coverImage") as string
    const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")

    await prisma.newsPost.create({
        data: {
            title,
            content,
            slug,
            coverImage,
            published: true,
            authorId: session.user.id || "admin",
        }
    })

    revalidatePath("/admin/news")
    revalidatePath("/news")
    redirect("/admin/news")
}

export async function updateNewsPost(postId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const coverImage = formData.get("coverImage") as string
    const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")

    await prisma.newsPost.update({
        where: { id: postId },
        data: {
            title,
            content,
            slug,
            coverImage,
        }
    })

    revalidatePath("/admin/news")
    revalidatePath(`/news/${slug}`)
    redirect("/admin/news")
}

export async function deleteNewsPost(postId: string) {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    await prisma.newsPost.delete({
        where: { id: postId }
    })

    revalidatePath("/admin/news")
    revalidatePath("/news")
}
