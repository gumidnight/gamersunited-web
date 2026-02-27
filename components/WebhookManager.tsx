"use client";

import { useState } from "react";
import { registerPrintfulWebhooks } from "@/lib/admin-actions";
import { Bell, Check, Loader2, AlertCircle } from "lucide-react";

export default function WebhookManager() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [msg, setMsg] = useState("");

    async function handleRegister() {
        setLoading(true);
        setStatus("idle");
        try {
            const res = await registerPrintfulWebhooks();
            if (res.success) {
                setStatus("success");
                setMsg("Webhooks registered successfully!");
            }
        } catch (error: any) {
            setStatus("error");
            setMsg(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-surface-base border border-surface-border rounded-2xl p-6 mt-12">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-neon-cyan/10 rounded-xl">
                    <Bell className="text-neon-cyan" size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Printful Webhooks</h3>
                    <p className="text-sm text-text-muted">Receive real-time updates when products change on Printful.</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="bg-surface-raised hover:bg-surface-overlay text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-surface-border flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        "Register Webhooks"
                    )}
                </button>

                {status === "success" && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold animate-in fade-in slide-in-from-left-2">
                        <Check size={16} /> {msg}
                    </div>
                )}

                {status === "error" && (
                    <div className="flex items-center gap-2 text-rose-400 text-sm font-bold">
                        <AlertCircle size={16} /> {msg}
                    </div>
                )}
            </div>
        </div>
    );
}
