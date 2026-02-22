"use client";
export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { Gamepad2, Trophy, Users, CheckCircle2, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const games = [
    { id: "valorant", name: "Valorant", icon: "🔴", color: "from-[#ff4655] to-[#ff4655]/50" },
    { id: "cs2", name: "CS2", icon: "🔫", color: "from-orange-500 to-yellow-500" },
    { id: "lol", name: "League of Legends", icon: "⚔️", color: "from-[#c89b3c] to-[#785a28]" },
    { id: "rocket-league", name: "Rocket League", icon: "⚽", color: "from-blue-500 to-cyan-500" },
    { id: "fortnite", name: "Fortnite", icon: "⛏️", color: "from-purple-500 to-pink-500" },
    { id: "eafc", name: "EA FC 25", icon: "🎮", color: "from-green-500 to-emerald-500" },
];

export default function TournamentsPage() {
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedGame) {
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 pt-24">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass p-12 rounded-[3rem] text-center max-w-xl border border-neon-cyan/30 shadow-[0_0_50px_rgba(34,211,238,0.2)]"
                >
                    <div className="w-20 h-20 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-8 text-neon-cyan">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-4xl font-black text-text-primary mb-4 uppercase tracking-tight">Interest Received!</h2>
                    <p className="text-text-secondary text-lg mb-8">
                        Thanks for showing interest. We'll prioritize the games with the most votes for our next big tournament. Join our Discord to stay updated on the official announcement!
                    </p>
                    <a
                        href="https://discord.gg/gamersunited"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-neon-purple hover:scale-105"
                    >
                        Join our Discord
                    </a>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 pt-32">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 bg-neon-cyan/10 text-neon-cyan px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-neon-cyan/20">
                        <Trophy size={14} /> Competitive Scene
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-text-primary mb-6 uppercase italic">
                        The Next <span className="text-gradient-brand">Arena</span>
                    </h1>
                    <p className="text-text-secondary text-xl max-w-2xl mx-auto leading-relaxed">
                        We're planning our next big offline event. Tell us what you want to play and be the first to know when registrations open.
                    </p>
                </motion.div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Left Side: Visual */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="sticky top-32"
                    >
                        <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden shadow-2xl border border-surface-border group">
                            <Image
                                src="/tournaments.jpg"
                                alt="Tournaments Background"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-surface-base/20 to-transparent" />
                            <div className="absolute bottom-10 left-10">
                                <h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tight">Real LAN Energy</h3>
                                <p className="text-text-secondary font-bold uppercase tracking-widest text-sm">Gamers United Offline Events</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-8">
                            <div className="glass p-6 rounded-3xl border border-surface-border">
                                <div className="text-neon-purple mb-4"><Star size={24} /></div>
                                <h4 className="font-black text-text-primary uppercase text-sm mb-1">Epic Prizes</h4>
                                <p className="text-text-muted text-xs">Cash pools and sponsor giveaways.</p>
                            </div>
                            <div className="glass p-6 rounded-3xl border border-surface-border">
                                <div className="text-neon-cyan mb-4"><Users size={24} /></div>
                                <h4 className="font-black text-text-primary uppercase text-sm mb-1">PRO Setup</h4>
                                <p className="text-text-muted text-xs">High-end PCs and professional production.</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side: Voting Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <div className="glass p-10 md:p-12 rounded-[3rem] border border-surface-border relative overflow-hidden">
                            <h2 className="text-3xl font-black text-text-primary mb-8 uppercase tracking-tight italic">
                                Vote for your game
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {games.map((game) => (
                                        <button
                                            key={game.id}
                                            type="button"
                                            onClick={() => setSelectedGame(game.id)}
                                            className={`
                                                relative flex flex-col items-center justify-center p-6 rounded-[2.5rem] border transition-all duration-300 group
                                                ${selectedGame === game.id
                                                    ? "bg-neon-cyan/10 border-neon-cyan shadow-[0_0_20px_rgba(34,211,238,0.2)] scale-105"
                                                    : "bg-surface-base/50 border-surface-border hover:border-surface-border-hover hover:bg-surface-base"
                                                }
                                            `}
                                        >
                                            <span className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">
                                                {game.icon}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest text-center ${selectedGame === game.id ? 'text-neon-cyan' : 'text-text-muted'}`}>
                                                {game.name}
                                            </span>
                                            {selectedGame === game.id && (
                                                <div className="absolute top-4 right-4 text-neon-cyan">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black uppercase tracking-[0.2em] text-text-muted">
                                            Your Details
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Your Discord Username"
                                            required
                                            className="w-full bg-surface-base border border-surface-border px-6 py-4 rounded-2xl text-text-primary focus:outline-none focus:border-neon-purple transition-all placeholder:text-text-muted/30 font-bold"
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            required
                                            className="w-full bg-surface-base border border-surface-border px-6 py-4 rounded-2xl text-text-primary focus:outline-none focus:border-neon-purple transition-all placeholder:text-text-muted/30 font-bold"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!selectedGame}
                                        className="w-full bg-gradient-brand text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-neon-purple hover-glow-purple transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        <Gamepad2 size={20} className="group-hover:rotate-12 transition-transform" /> Submit Interest
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
