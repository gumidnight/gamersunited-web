/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Edit, Trash2 } from "lucide-react";

export default async function AdminNewsPage() {
    const session = await auth();

    // Basic admin validation based on a role column in Prisma DB
    // Alternatively, map to specific Discord IDs
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        // Basic fallback for development
        const allowedAdmins = ["example-discord-id", "admin@gamersunited.cy"];
        if (!allowedAdmins.includes(session?.user?.email || session?.user?.id || "")) {
            redirect("/");
        }
    }

    const posts = await prisma.newsPost.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 mt-24 text-white">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#b026ff]">
                        NEWS MANAGEMENT
                    </h1>
                    <p className="text-gray-400 mt-1">Manage articles, updates, and announcements</p>
                </div>
                <Link href="/admin/news/new" className="bg-[#b026ff] hover:bg-[#9015db] px-6 py-3 rounded-md font-bold text-sm shadow-[0_0_15px_rgba(176,38,255,0.4)] transition-all flex items-center gap-2">
                    <Plus size={18} /> New Post
                </Link>
            </div>

            <div className="bg-[#101218] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-900 border-b border-gray-800 text-sm uppercase text-gray-400 font-bold">
                            <th className="p-4">Title</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No news posts found. Create one.
                                </td>
                            </tr>
                        ) : null}
                        {posts.map((post: any) => (
                            <tr key={post.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                <td className="p-4 font-semibold">{post.title}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${post.published ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                                        {post.published ? "Published" : "Draft"}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400 text-sm">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <Link href={`/admin/news/${post.id}`} className="text-gray-400 hover:text-[#00f0ff] transition-colors p-2 rounded-md hover:bg-gray-800">
                                            <Edit size={18} />
                                        </Link>
                                        <form action={async () => {
                                            "use server";
                                            await prisma.newsPost.delete({ where: { id: post.id } });
                                        }}>
                                            <button type="submit" className="text-gray-400 hover:text-[#ff003c] transition-colors p-2 rounded-md hover:bg-gray-800" title="Delete Post">
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
