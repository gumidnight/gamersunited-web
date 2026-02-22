"use client";

import { motion } from "framer-motion";
import { Users, Target, Trophy, Heart } from "lucide-react";

export default function AboutPage() {
    const stats = [
        { label: "Active Members", value: "2,500+", icon: <Users size={24} /> },
        { label: "Tournaments Held", value: "120+", icon: <Trophy size={24} /> },
        { label: "Games Covered", value: "30+", icon: <Target size={24} /> },
        { label: "Years Active", value: "5+", icon: <Heart size={24} /> },
    ];

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
                    ABOUT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#b026ff]">US</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Gamers United Cyprus is the island&apos;s premier esports community, bringing players together
                    through tournaments, events, and a shared passion for competitive gaming.
                </p>
            </motion.div>

            {/* Stats Row */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
            >
                {stats.map((stat, i) => (
                    <div key={i} className="bg-[#101218] border border-gray-800 rounded-2xl p-6 text-center hover:border-[#00f0ff]/40 transition-colors">
                        <div className="text-[#00f0ff] flex justify-center mb-3">{stat.icon}</div>
                        <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                        <div className="text-gray-400 text-sm">{stat.label}</div>
                    </div>
                ))}
            </motion.div>

            {/* Mission */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-[#101218] border border-gray-800 rounded-2xl p-10 md:p-16 mb-16"
            >
                <h2 className="text-3xl font-black mb-6 text-white">Our Mission</h2>
                <p className="text-gray-400 leading-relaxed text-lg">
                    We exist to cultivate a strong, inclusive gaming community in Cyprus. Whether you&apos;re a casual player
                    or a competitive esports athlete, Gamers United provides the platform, the events, and the network to
                    level up your experience. We organize tournaments across multiple titles, host community events, and
                    provide a central hub for gaming culture on the island.
                </p>
            </motion.section>

            {/* What We Do */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {[
                    {
                        title: "Tournaments",
                        desc: "From weekly online cups to major LAN events, we run competitive circuits across the most popular esports titles.",
                        color: "#00f0ff",
                    },
                    {
                        title: "Community Events",
                        desc: "Game nights, watch parties, meetups, and more. We bring the community together both online and offline.",
                        color: "#b026ff",
                    },
                    {
                        title: "Content & News",
                        desc: "Stay updated with the latest esports news, tournament results, and gaming content from Cyprus and beyond.",
                        color: "#ff003c",
                    },
                ].map((item, i) => (
                    <div key={i} className="bg-[#101218] border border-gray-800 rounded-2xl p-8 hover:border-gray-600 transition-colors">
                        <div className="w-3 h-3 rounded-full mb-4" style={{ backgroundColor: item.color }} />
                        <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </motion.section>
        </div>
    );
}
