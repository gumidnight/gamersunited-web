"use client";

import { useState } from "react";
import { Loader2, Check, ArrowRight } from "lucide-react";

export default function NewsletterForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setStatus("idle");

        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setEmail("");
                setMessage("Welcome to the hub!");
            } else {
                setStatus("error");
                setMessage(data.error || "Something went wrong.");
            }
        } catch (error) {
            setStatus("error");
            setMessage("Failed to connect. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto relative">
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || status === "success"}
                    className="flex-1 bg-surface-raised border border-surface-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-purple transition-all disabled:opacity-50"
                    required
                />
                <button
                    type="submit"
                    disabled={loading || status === "success"}
                    className="bg-gradient-brand text-white lg:px-6 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-neon-purple hover-glow-purple transition-all disabled:opacity-50 min-w-[80px] flex items-center justify-center"
                >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : status === "success" ? (
                        <Check size={16} />
                    ) : (
                        "Join"
                    )}
                </button>
            </form>

            {status !== "idle" && (
                <p className={`text-[10px] mt-2 font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1 text-center ${status === "success" ? "text-emerald-400" : "text-rose-400"
                    }`}>
                    {message}
                </p>
            )}
        </div>
    );
}
