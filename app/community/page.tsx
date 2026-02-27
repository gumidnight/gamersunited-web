"use client";

import { motion } from "framer-motion";
import { MessageCircle, Users, Gamepad2, Trophy, type LucideIcon } from "lucide-react";
import siteContent from "@/content/site.json";
import InstagramFeed from "@/components/InstagramFeed";

const iconMap: Record<string, LucideIcon> = {
    Users,
    Trophy,
    Gamepad2,
};

const accentColorMap: Record<string, string> = {
    neonCyan: "text-neon-cyan",
    neonPurple: "text-neon-purple",
    neonPink: "text-neon-pink",
};

export default function CommunityPage() {
    const { community } = siteContent;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16"
            >
                <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
                    OUR <span className="text-gradient-brand">COMMUNITY</span>
                </h1>
                <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                    {community.description}
                </p>
            </motion.div>

            {/* Instagram Section */}
            <InstagramFeed />

            {/* Discord CTA */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-gradient-brand-subtle border border-neon-purple/20 rounded-3xl p-10 md:p-16 text-center mb-16"
            >
                <div className="text-6xl mb-6">💬</div>
                <h2 className="text-3xl font-black text-text-primary mb-4">
                    {community.discord.title}
                </h2>
                <p className="text-text-secondary max-w-lg mx-auto mb-8">
                    {community.discord.description}
                </p>
                <a
                    href={community.discord.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(88,101,242,0.4)] transition-all"
                >
                    <MessageCircle size={22} /> {community.discord.buttonLabel}
                </a>
            </motion.div>

            {/* Community Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {community.features.map((item, i) => {
                    const Icon = iconMap[item.icon] ?? Users;
                    const colorClass = accentColorMap[item.accent] ?? "text-neon-cyan";

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 * i, duration: 0.4 }}
                            className="glass rounded-2xl p-8 hover:border-surface-border-hover transition-colors"
                        >
                            <div className="bg-surface-base w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                                <Icon size={28} className={colorClass} />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-2">
                                {item.title}
                            </h3>
                            <p className="text-text-secondary text-sm">
                                {item.description}
                            </p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
