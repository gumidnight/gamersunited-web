import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const title = slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    return {
        title: `${title} | Gamers United News`,
        description: `Read about ${title} on Gamers United Cyprus.`,
        openGraph: {
            title,
            description: `Read about ${title} on Gamers United Cyprus.`,
            type: "article",
        },
    };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // In production this would fetch from the database via prisma
    // const post = await prisma.newsPost.findUnique({ where: { slug } });

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <article>
                <div className="mb-8">
                    <span className="text-[#b026ff] text-sm font-semibold uppercase tracking-wide">News</span>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-2 mb-4 text-white">
                        {slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </h1>
                    <div className="text-gray-500 text-sm">Published by Gamers United</div>
                </div>

                {/* Cover Image Placeholder */}
                <div className="h-64 md:h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mb-10">
                    <span className="text-gray-600 text-6xl font-black opacity-20">GU</span>
                </div>

                <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                    <p>
                        This is a placeholder article for <strong>{slug.replace(/-/g, " ")}</strong>.
                        In the live version, the content will be fetched from the database and rendered as rich text (Markdown/HTML).
                    </p>
                    <p>
                        The admin panel at <code>/admin/news</code> allows authorized users to create, edit, and publish news articles
                        with full rich text support, cover images, and SEO metadata.
                    </p>
                </div>

                {/* Comments Section Placeholder */}
                <div className="mt-16 border-t border-gray-800 pt-10">
                    <h2 className="text-2xl font-bold text-white mb-6">Comments</h2>
                    <div className="bg-[#101218] border border-gray-800 rounded-xl p-8 text-center text-gray-500">
                        <p>Login with Discord to leave a comment.</p>
                    </div>
                </div>
            </article>
        </div>
    );
}
