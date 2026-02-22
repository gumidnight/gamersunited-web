"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Users, Gamepad2, Trophy, type LucideIcon, Zap } from "lucide-react";
import siteContent from "@/content/site.json";
import { getDiscordStatus } from "@/lib/discord-actions";

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

export default function CommunitySection() {
    const { community } = siteContent;
    const [onlineCount, setOnlineCount] = useState<number>(0);
    const [activePlayers, setActivePlayers] = useState<{ username: string, game: string }[]>([]);

    useEffect(() => {
        const fetchStatus = async () => {
            const status = await getDiscordStatus();
            if (status) {
                setOnlineCount(status.onlineCount);
                const playing = status.members
                    .filter((m: any) => m.game)
                    .map((m: any) => ({ username: m.username, game: m.game.name }))
                    .slice(0, 3);
                setActivePlayers(playing);
            }
        };
        fetchStatus();
    }, []);

    return (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-gradient-brand-subtle border border-neon-purple/20 rounded-3xl p-10 md:p-16 text-left relative overflow-hidden glass"
                >
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-[#5865F2]/20 text-[#5865F2] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-[#5865F2]/30">
                            <MessageCircle size={14} /> Official Server
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black text-text-primary mb-6 leading-tight">
                            {community.discord.title}
                        </h3>
                        <p className="text-text-secondary text-lg mb-10 leading-relaxed max-w-md">
                            {community.discord.description}
                        </p>

                        {/* Removed live member stats */}

                        {/* Removed active players list */}
                        <a
                            href={community.discord.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white px-10 py-5 rounded-2xl font-black transition-all shadow-neon-purple hover:scale-105 active:scale-95 uppercase tracking-widest text-sm"
                        >
                            <MessageCircle size={20} /> {community.discord.buttonLabel}
                        </a>
                    </div>

                    {/* Decorative background element */}
                    <div className="absolute -bottom-10 -right-10 opacity-10 blur-2xl bg-[#5865F2] w-64 h-64 rounded-full pointer-events-none" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="flex justify-center lg:justify-end"
                >
                    {/* iPhone Mockup */}
                    <div className="relative mx-auto w-[320px] h-[650px] bg-[#0d0d0d] rounded-[3rem] border-[8px] border-[#1a1a1a] shadow-2xl overflow-hidden shadow-neon-purple/20">
                        {/* Notch / Dynamic Island */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1a1a1a] rounded-b-2xl z-20 flex items-center justify-center">
                            <div className="w-12 h-1 bg-[#0d0d0d] rounded-full" />
                        </div>

                        {/* Side Buttons */}
                        <div className="absolute -left-[10px] top-24 w-[2px] h-12 bg-[#333] rounded-r-sm" />
                        <div className="absolute -left-[10px] top-40 w-[2px] h-12 bg-[#333] rounded-r-sm" />
                        <div className="absolute -right-[10px] top-32 w-[2px] h-20 bg-[#333] rounded-l-sm" />

                        {/* Screen Content */}
                        <div className="absolute inset-0 w-full h-full pt-10 pb-4 px-2">
                            <iframe
                                src="https://discordapp.com/widget?id=688822800210854005&theme=dark"
                                title="Gamers United Discord Widget"
                                width="100%"
                                height="100%"
                                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                                className="rounded-2xl border-none"
                            ></iframe>
                        </div>

                        {/* Reflections/Glow on glass */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-transparent z-10" />
                    </div>

                    {/* Back Glow */}
                    <div className="absolute w-[400px] h-[400px] bg-neon-purple/10 blur-[100px] -z-10 rounded-full" />
                </motion.div>
            </div>


        </section>
    );
}
