import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";

export default async function NewsPage() {
    const posts = await prisma.newsPost.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
                <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 uppercase">
                    LATEST <span className="text-gradient-brand">NEWS</span>
                </h1>
                <p className="text-text-secondary text-lg max-w-xl mx-auto">
                    Stay updated with the latest events, tournaments, and community news from Gamers United Cyprus.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {posts.length === 0 ? (
                    <div className="col-span-full text-center py-20 glass rounded-3xl border-2 border-dashed border-surface-border">
                        <p className="text-text-muted text-xl italic font-bold">No news articles found. Check back soon!</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="h-full">
                            <Link href={`/news/${post.slug}`} className="block h-full">
                                <div className="glass rounded-3xl overflow-hidden hover:border-surface-border-hover transition-all hover:-translate-y-2 group h-full shadow-2xl">
                                    <div className="aspect-[16/9] w-full bg-gradient-to-br from-surface-overlay to-surface-base flex items-center justify-center relative overflow-hidden">
                                        <span className="text-text-muted text-7xl font-black opacity-10 group-hover:scale-125 transition-transform duration-700">GU</span>
                                        <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-transparent to-transparent opacity-60" />
                                    </div>
                                    <div className="p-8">
                                        <div className="flex items-center gap-2 text-neon-purple text-xs font-black uppercase tracking-widest mb-4">
                                            <Calendar size={14} />
                                            {new Date(post.createdAt).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </div>
                                        <h2 className="text-3xl font-black text-text-primary mb-4 group-hover:text-neon-cyan transition-colors leading-tight">
                                            {post.title}
                                        </h2>
                                        <p className="text-text-secondary text-lg mb-6 line-clamp-2 leading-relaxed">
                                            {post.content.replace(/<[^>]*>?/gm, '').substring(0, 160)}...
                                        </p>
                                        <span className="text-neon-cyan text-sm font-black flex items-center gap-2 group-hover:gap-3 transition-all uppercase tracking-widest">
                                            Read Full Article <ArrowRight size={16} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
