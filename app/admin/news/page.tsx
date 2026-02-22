export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Edit, Trash2 } from "lucide-react";

export default async function AdminNewsPage() {
    const posts = await prisma.newsPost.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-text-primary">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gradient-brand">
                        NEWS MANAGEMENT
                    </h1>
                    <p className="text-text-secondary mt-1">Manage articles, updates, and announcements</p>
                </div>
                <Link href="/admin/news/new" className="bg-gradient-brand text-white px-6 py-3 rounded-md font-bold text-sm shadow-neon-purple hover-glow-purple transition-all flex items-center gap-2">
                    <Plus size={18} /> New Post
                </Link>
            </div>

            <div className="glass rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-base border-b border-surface-border text-sm uppercase text-text-muted font-bold">
                            <th className="p-4">Title</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-text-muted">
                                    No news posts found. Create one.
                                </td>
                            </tr>
                        ) : null}
                        {posts.map((post: any) => (
                            <tr key={post.id} className="border-b border-surface-border/50 hover:bg-surface-overlay/30 transition-colors">
                                <td className="p-4 font-semibold">{post.title}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${post.published ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' : 'bg-surface-base text-text-muted border border-surface-border'}`}>
                                        {post.published ? "Published" : "Draft"}
                                    </span>
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <Link href={`/admin/news/${post.id}`} className="text-text-muted hover:text-neon-cyan transition-colors p-2 rounded-md hover:bg-surface-overlay">
                                            <Edit size={18} />
                                        </Link>
                                        <form action={async () => {
                                            "use server";
                                            const { deleteNewsPost } = await import("@/lib/news-actions");
                                            await deleteNewsPost(post.id);
                                        }}>
                                            <button type="submit" className="text-text-muted hover:text-neon-pink transition-colors p-2 rounded-md hover:bg-surface-overlay" title="Delete Post">
                                                <Trash2 size={18} />
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
