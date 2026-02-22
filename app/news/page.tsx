"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";

// Sample static news for now — later these will come from the database
const sampleNews = [
    {
        id: "1",
        slug: "gamers-united-championship-2026",
        title: "Gamers United Championship 2026 Announced",
        excerpt: "The biggest esports event in Cyprus history is coming this summer. Registration opens soon.",
        coverImage: null,
        createdAt: "2026-02-20",
        published: true,
    },
    {
        id: "2",
        slug: "new-discord-server-launch",
        title: "Join Our New Discord Server",
        excerpt: "We've revamped our Discord with new channels, roles, and community features. Come say hello!",
        coverImage: null,
        createdAt: "2026-02-18",
        published: true,
    },
    {
        id: "3",
        slug: "valorant-winter-cup-results",
        title: "Valorant Winter Cup — Final Results",
        excerpt: "Team Kryptonite takes the crown in an electrifying Grand Final. Full recap inside.",
        coverImage: null,
        createdAt: "2026-02-15",
        published: true,
    },
    {
        id: "4",
        slug: "merch-store-now-open",
        title: "Official Merch Store Is Now Open",
        excerpt: "Rep your community with exclusive Gamers United apparel. Limited first-run available.",
        coverImage: null,
        createdAt: "2026-02-10",
        published: true,
    },
];

export default function NewsPage() {
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16"
            >
                <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
                    LATEST <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff003c] to-[#b026ff]">NEWS</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-xl mx-auto">
                    Stay updated with the latest from Gamers United Cyprus — tournaments, events, and community updates.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                {sampleNews.map((post, i) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i, duration: 0.4 }}
                    >
                        <Link href={`/news/${post.slug}`}>
                            <div className="bg-[#101218] border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-all hover:-translate-y-1 group h-full">
                                {/* Cover image placeholder */}
                                <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                    <span className="text-gray-600 text-5xl font-black opacity-30">GU</span>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
                                        <Calendar size={14} />
                                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#00f0ff] transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-gray-400 text-sm mb-4">{post.excerpt}</p>
                                    <span className="text-[#b026ff] text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Read More <ArrowRight size={14} />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
