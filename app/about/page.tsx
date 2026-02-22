"use client";
export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { Users, Target, Trophy, Heart, type LucideIcon } from "lucide-react";
import siteContent from "@/content/site.json";

const iconMap: Record<string, LucideIcon> = { Users, Trophy, Target, Heart };

const accentMap: Record<string, string> = {
    neonCyan: "border-neon-cyan/40",
    neonPurple: "border-neon-purple/40",
    neonPink: "border-neon-pink/40",
};

export default function AboutPage() {
    const { about } = siteContent;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-20"
            >
                <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
                    ABOUT <span className="text-gradient-brand">US</span>
                </h1>
                <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                    {about.description}
                </p>
            </motion.div>

            {/* Stats Row */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
            >
                {about.stats.map((stat, i) => {
                    const Icon = iconMap[stat.icon] ?? Users;
                    return (
                        <div
                            key={i}
                            className="glass rounded-2xl p-6 text-center hover:border-neon-cyan/40 transition-colors"
                        >
                            <div className="text-neon-cyan flex justify-center mb-3">
                                <Icon size={24} />
                            </div>
                            <div className="text-3xl font-black text-text-primary mb-1">
                                {stat.value}
                            </div>
                            <div className="text-text-secondary text-sm">{stat.label}</div>
                        </div>
                    );
                })}
            </motion.div>

            {/* Mission */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="glass rounded-2xl p-10 md:p-16 mb-16"
            >
                <h2 className="text-3xl font-black mb-6 text-text-primary">Our Mission</h2>
                <p className="text-text-secondary leading-relaxed text-lg">
                    {about.mission}
                </p>
            </motion.section>

            {/* Pillars */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {about.pillars.map((item, i) => (
                    <div
                        key={i}
                        className={`glass rounded-2xl p-8 hover:${accentMap[item.accent] ?? "border-surface-border-hover"} transition-colors`}
                    >
                        <div
                            className={`w-3 h-3 rounded-full mb-4 ${item.accent === "neonCyan"
                                    ? "bg-neon-cyan"
                                    : item.accent === "neonPurple"
                                        ? "bg-neon-purple"
                                        : "bg-neon-pink"
                                }`}
                        />
                        <h3 className="text-xl font-bold mb-3 text-text-primary">
                            {item.title}
                        </h3>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            {item.description}
                        </p>
                    </div>
                ))}
            </motion.section>
        </div>
    );
}
