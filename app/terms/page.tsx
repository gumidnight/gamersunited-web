"use client";

import { motion } from "framer-motion";
import { Gavel, Users, Ban, Scale } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-xs font-black uppercase tracking-widest mb-6">
                    <Scale size={14} /> Community Standards
                </div>
                <h1 className="text-5xl md:text-6xl font-black mb-4 uppercase italic tracking-tighter">
                    TERMS OF <span className="text-gradient-brand">SERVICE</span>
                </h1>
                <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                    By joining Gamers United Cyprus, you agree to uphold our values and follow these community rules.
                </p>
            </motion.div>

            <div className="space-y-8">
                <div className="glass p-8 md:p-10 rounded-[2rem] border border-surface-border">
                    <div className="flex items-center gap-4 mb-6">
                        <Users className="text-neon-cyan" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-tight">1. Code of Conduct</h2>
                    </div>
                    <p className="text-text-secondary leading-relaxed text-lg">
                        Gamers United Cyprus is an inclusive community. We have zero tolerance for harassment, racism, sexism, or any form of discrimination. Respect your fellow gamers at all times during tournaments and in our Discord channels.
                    </p>
                </div>

                <div className="glass p-8 md:p-10 rounded-[2rem] border border-surface-border">
                    <div className="flex items-center gap-4 mb-6">
                        <Gavel className="text-neon-purple" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-tight">2. Tournament Fair Play</h2>
                    </div>
                    <p className="text-text-secondary leading-relaxed text-lg">
                        Cheating, hacking, or exploiting game mechanics in any of our organized events will result in an immediate and permanent ban. We value competitive integrity above all else.
                    </p>
                </div>

                <div className="glass p-8 md:p-10 rounded-[2rem] border border-surface-border">
                    <div className="flex items-center gap-4 mb-6">
                        <Ban className="text-neon-pink" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-tight">3. Account & Termination</h2>
                    </div>
                    <p className="text-text-secondary leading-relaxed text-lg">
                        We reserve the right to suspend or terminate community access for users who repeatedly violate these terms or the specific rules of individual tournaments.
                    </p>
                </div>

                <div className="glass p-8 md:p-10 rounded-[2rem] border border-surface-border">
                    <div className="flex items-center gap-4 mb-6">
                        <Scale className="text-neon-green" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-tight">4. Limitation of Liability</h2>
                    </div>
                    <p className="text-text-secondary leading-relaxed text-lg">
                        Gamers United Cyprus is not responsible for hardware issues, internet latency, or game-server outages during competitive play. All tournament results are final once verified by moderators.
                    </p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-16 text-center text-text-muted"
            >
                Last revision: Feb 2026. For legal inquiries: <a href="mailto:admin@gamersunited.cy" className="text-neon-purple hover:underline">admin@gamersunited.cy</a>
            </motion.div>
        </div>
    );
}
