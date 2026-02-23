"use client";

import { motion } from "framer-motion";
import { HelpCircle, ChevronDown, MessageSquare, Shield, Trophy, ShoppingBag } from "lucide-react";
import { useState } from "react";

const faqs = [
    {
        question: "How do I join a tournament?",
        answer: "Joining a tournament is easy! First, make sure you've joined our official Discord server. Once you're in, navigate to the #tournaments channel to see ongoing and upcoming events. Detailed registration links and rules are provided for each tournament.",
        category: "Tournaments",
        icon: Trophy
    },
    {
        question: "Is there a membership fee?",
        answer: "Basic membership to Gamers United is completely free! We want to keep gaming accessible to everyone. Some premium tournaments or exclusive events may have entry fees, which directly contribute to prize pools and event costs.",
        category: "Community",
        icon: HelpCircle
    },
    {
        question: "Where can I buy official merch?",
        answer: "You can find all our official apparel and accessories in our E-Shop. We offer high-quality hoodies, jerseys, and accessories that ship nationwide across Cyprus.",
        category: "Shop",
        icon: ShoppingBag
    },
    {
        question: "How can my team partner with you?",
        answer: "We love collaborating with local teams! Please reach out to our management team via the #partnerships channel on Discord or email us at contact@gamersunited.cy with your team profile and proposal.",
        category: "Community",
        icon: MessageSquare
    },
    {
        question: "Are there age restrictions for tournaments?",
        answer: "Age requirements vary depending on the specific game's PEGI rating and tournament regulations. Generally, players under 16 require parental consent. Specific details are always listed in the tournament rulebook.",
        category: "Tournaments",
        icon: Shield
    }
];

function FAQItem({ question, answer, icon: Icon }: { question: string, answer: string, icon: any }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="glass rounded-2xl border border-surface-border overflow-hidden transition-all hover:border-surface-border-hover mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-base flex items-center justify-center text-neon-purple group-hover:scale-110 transition-transform">
                        <Icon size={20} />
                    </div>
                    <span className="text-lg font-bold text-text-primary tracking-tight">{question}</span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="text-text-muted"
                >
                    <ChevronDown size={20} />
                </motion.div>
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                className="overflow-hidden"
            >
                <div className="p-6 pt-0 text-text-secondary leading-relaxed border-t border-surface-border/50 mt-2">
                    {answer}
                </div>
            </motion.div>
        </div>
    );
}

export default function FAQPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <h1 className="text-5xl md:text-6xl font-black mb-4 uppercase italic tracking-tighter">
                    FREQUENTLY ASKED <span className="text-gradient-brand">QUESTIONS</span>
                </h1>
                <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                    Everything you need to know about the biggest gaming community in Cyprus. Can't find what you're looking for? Join our Discord.
                </p>
            </motion.div>

            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <FAQItem {...faq} />
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-16 text-center glass p-10 rounded-[2rem] border border-surface-border"
            >
                <h3 className="text-2xl font-black mb-4 uppercase">STILL HAVE QUESTIONS?</h3>
                <p className="text-text-secondary mb-8">Join our Discord server and talk to our support team directly.</p>
                <a
                    href="https://discord.gg/gamersunitedcy"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block bg-gradient-brand text-white px-10 py-4 rounded-xl font-bold hover:scale-105 transition-transform"
                >
                    Join Discord Support
                </a>
            </motion.div>
        </div>
    );
}
