export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { updateNewsPost } from "@/lib/news-actions";
import NewsPostForm from "@/components/NewsPostForm";

export default async function EditNewsPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const post = await prisma.newsPost.findUnique({
        where: { id }
    });

    if (!post) {
        notFound();
    }

    const updateWithId = updateNewsPost.bind(null, post.id);

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-text-primary">
            <h1 className="text-3xl font-black text-gradient-brand mb-8 uppercase">
                Edit Post: {post.title}
            </h1>

            <NewsPostForm
                action={updateWithId}
                submitLabel="Update Post"
                titleLabel={`Edit Post: ${post.title}`}
                initialData={{
                    title: post.title,
                    content: post.content,
                    coverImage: post.coverImage
                }}
            />
        </div>
    );
}
