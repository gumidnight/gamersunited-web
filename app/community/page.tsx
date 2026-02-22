"use client";

import { motion } from "framer-motion";
import { MessageCircle, Users, Gamepad2, Trophy } from "lucide-react";
import Link from "next/link";

export default function CommunityPage() {
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16"
            >
                <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
                    OUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b026ff] to-[#00f0ff]">COMMUNITY</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Join thousands of gamers across Cyprus. Find your squad, compete in tournaments, and be part of something bigger.
                </p>
            </motion.div>

            {/* Discord CTA */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-gradient-to-br from-[#5865F2]/20 to-[#b026ff]/10 border border-[#5865F2]/30 rounded-3xl p-10 md:p-16 text-center mb-16"
            >
                <div className="text-6xl mb-6">💬</div>
                <h2 className="text-3xl font-black text-white mb-4">Join Our Discord</h2>
                <p className="text-gray-400 max-w-lg mx-auto mb-8">
                    Our Discord server is the heart of the community. Chat with fellow gamers, find teammates,
                    get tournament updates, and hang out in voice channels.
                </p>
                <a
                    href="https://discord.gg/gamersunited"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(88,101,242,0.4)] transition-all"
                >
                    <MessageCircle size={22} /> Join Discord Server
                </a>
            </motion.div>

            {/* Community Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        icon: <Users size={28} className="text-[#00f0ff]" />,
                        title: "Find Your Team",
                        desc: "Looking for teammates? Use our LFG channels to connect with players at your skill level.",
                    },
                    {
                        icon: <Trophy size={28} className="text-[#b026ff]" />,
                        title: "Compete & Win",
                        desc: "Participate in weekly tournaments and seasonal leagues with prizes and recognition.",
                    },
                    {
                        icon: <Gamepad2 size={28} className="text-[#ff003c]" />,
                        title: "Game Nights",
                        desc: "Join casual game nights every week. No pressure, just fun with the community.",
                    },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 * i, duration: 0.4 }}
                        className="bg-[#101218] border border-gray-800 rounded-2xl p-8 hover:border-gray-600 transition-colors"
                    >
                        <div className="bg-gray-900 w-14 h-14 rounded-xl flex items-center justify-center mb-4">{item.icon}</div>
                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
