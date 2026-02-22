"use client";

import { motion } from "framer-motion";
import { Users, Target, Trophy, Heart, type LucideIcon } from "lucide-react";
import siteContent from "@/content/site.json";

const iconMap: Record<string, LucideIcon> = { Users, Trophy, Target, Heart };

const accentMap: Record<string, string> = {
    neonCyan: "border-neon-cyan/40",
    neonPurple: "border-neon-purple/40",
    neonPink: "border-neon-pink/40",
};

export default function AboutSection() {
    const { about } = siteContent;

    return (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16"
            >
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 uppercase">
                    ABOUT <span className="text-gradient-brand">US</span>
                </h2>
                <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                    {about.description}
                </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-20">
                {about.stats.map((stat, i) => {
                    const Icon = iconMap[stat.icon] ?? Users;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 * i, duration: 0.4 }}
                            className="glass rounded-3xl p-10 text-center hover:border-neon-cyan/40 transition-all hover:-translate-y-2 shadow-2xl"
                        >
                            <div className="text-neon-cyan flex justify-center mb-6">
                                <Icon size={32} />
                            </div>
                            <div className="text-4xl font-black text-text-primary mb-2 tracking-tighter">
                                {stat.value}
                            </div>
                            <div className="text-text-secondary text-sm font-black uppercase tracking-widest">{stat.label}</div>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="glass rounded-3xl p-12 md:p-20 relative overflow-hidden shadow-2xl"
            >
                <div className="absolute top-0 left-0 w-32 h-32 bg-neon-purple/10 blur-[60px] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-neon-cyan/10 blur-[60px] translate-x-1/2 translate-y-1/2" />

                <p className="text-text-primary leading-relaxed text-2xl font-medium text-center relative z-10 max-w-4xl mx-auto">
                    {about.mission}
                </p>
            </motion.div>
        </section>
    );
}
