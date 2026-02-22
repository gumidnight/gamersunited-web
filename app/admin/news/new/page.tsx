import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createNewsPost } from "@/lib/news-actions";
import NewsPostForm from "@/components/NewsPostForm";

export default async function NewNewsPostPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-text-primary">
            <h1 className="text-3xl font-black text-gradient-brand mb-8 uppercase">
                Create New Post
            </h1>

            <NewsPostForm
                action={createNewsPost}
                submitLabel="Publish Post"
                titleLabel="Create New Post"
            />
        </div>
    );
}
