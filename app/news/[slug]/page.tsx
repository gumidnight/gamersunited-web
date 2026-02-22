import { auth } from "@/auth";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CommentForm from "@/components/CommentForm";
import Image from "next/image";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;

    const post = await prisma.newsPost.findUnique({
        where: { slug }
    });

    if (!post) {
        return {
            title: "Post Not Found | Gamers United News"
        };
    }

    return {
        title: `${post.title} | Gamers United News`,
        description: post.content.substring(0, 160),
        openGraph: {
            title: post.title,
            description: post.content.substring(0, 160),
            type: "article",
        },
    };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const session = await auth();

    const post = await prisma.newsPost.findUnique({
        where: { slug },
        include: {
            comments: {
                include: {
                    user: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });

    if (!post) {
        notFound();
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <article>
                <div className="mb-8">
                    <span className="text-neon-purple text-sm font-semibold uppercase tracking-wide">
                        News
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-2 mb-4 text-text-primary">
                        {post.title}
                    </h1>
                    <div className="text-text-muted text-sm">
                        Published on {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                </div>

                {/* Cover Image Placeholder */}
                <div className="h-64 md:h-96 bg-gradient-to-br from-surface-overlay to-surface-base rounded-2xl flex items-center justify-center mb-10 overflow-hidden">
                    {post.coverImage ? (
                        <Image
                            src={post.coverImage}
                            alt={post.title}
                            width={1200}
                            height={600}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-text-muted text-6xl font-black opacity-20">GU</span>
                    )}
                </div>

                <div className="prose prose-invert prose-lg max-w-none text-text-secondary whitespace-pre-wrap">
                    {post.content}
                </div>

                {/* Comments Section */}
                <div className="mt-16 border-t border-surface-border pt-10">
                    <h2 className="text-2xl font-bold text-text-primary mb-6">Comments</h2>

                    {session ? (
                        <CommentForm
                            postId={post.id}
                            user={{
                                name: session.user?.name,
                                image: session.user?.image
                            }}
                        />
                    ) : (
                        <div className="glass rounded-xl p-8 text-center text-text-muted">
                            <p>Login with Discord to leave a comment.</p>
                        </div>
                    )}

                    <div className="mt-10 space-y-6">
                        {post.comments.length > 0 ? (
                            post.comments.map((comment) => (
                                <div key={comment.id} className="flex gap-4 p-4 rounded-xl border border-surface-border bg-surface-base/30">
                                    <div className="flex-shrink-0">
                                        {comment.user.image && (
                                            <Image
                                                src={comment.user.image}
                                                alt={comment.user.name || ""}
                                                width={40}
                                                height={40}
                                                className="rounded-full border border-surface-border"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold text-text-primary">
                                                {comment.user.name}
                                            </span>
                                            <span className="text-xs text-text-muted">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-text-secondary whitespace-pre-wrap break-words">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-text-muted py-10 italic">
                                No comments yet. Be the first to join the conversation!
                            </p>
                        )}
                    </div>
                </div>
            </article>
        </div>
    );
}
