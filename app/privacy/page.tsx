"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-black uppercase tracking-widest mb-6">
                    <ShieldCheck size={14} /> Security First
                </div>
                <h1 className="text-5xl md:text-6xl font-black mb-4 uppercase italic tracking-tighter">
                    PRIVACY <span className="text-gradient-brand">POLICY</span>
                </h1>
                <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                    Last Updated: February 22, 2026. Your privacy is a priority at Gamers United.
                </p>
            </motion.div>

            <div className="space-y-12">
                <section className="glass p-8 md:p-12 rounded-[2rem] border border-surface-border">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-surface-base flex items-center justify-center text-neon-cyan">
                            <Eye size={24} />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tight">Information We Collect</h2>
                    </div>
                    <div className="space-y-4 text-text-secondary leading-relaxed text-lg">
                        <p>We collect information that you provide directly to us when you register for an account, join our Discord server, participate in tournaments, or make a purchase in our E-Shop.</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Discord ID and display name</li>
                            <li>Email address for communications</li>
                            <li>Shipping information for merch orders</li>
                            <li>Game IDs for tournament results tracking</li>
                        </ul>
                    </div>
                </section>

                <section className="glass p-8 md:p-12 rounded-[2rem] border border-surface-border">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-surface-base flex items-center justify-center text-neon-purple">
                            <Lock size={24} />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tight">How We Use Data</h2>
                    </div>
                    <div className="space-y-4 text-text-secondary leading-relaxed text-lg">
                        <p>Your data is used solely to provide and improve our community services:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Confirming tournament eligibility</li>
                            <li>Processing and shipping your merch</li>
                            <li>Sending important community updates</li>
                            <li>Securing our community from bot activity</li>
                        </ul>
                    </div>
                </section>

                <section className="glass p-8 md:p-12 rounded-[2rem] border border-surface-border">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-surface-base flex items-center justify-center text-neon-pink">
                            <FileText size={24} />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tight">Data Sharing</h2>
                    </div>
                    <div className="space-y-4 text-text-secondary leading-relaxed text-lg">
                        <p>We do not sell your personal information. We only share data with third-party partners (like Printify or Stripe) to fulfill your orders and process payments securely.</p>
                    </div>
                </section>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-16 text-center text-text-muted text-sm"
            >
                Questions about your data? Contact us at <a href="mailto:contact@gamersunited.cy" className="text-neon-cyan hover:underline">contact@gamersunited.cy</a>
            </motion.div>
        </div>
    );
}
