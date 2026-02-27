"use client";

import React, { useEffect } from 'react';
import Link from "next/link";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/CartContext";

export default function SuccessPage() {
    const { clearCart } = useCart();

    useEffect(() => {
        clearCart();
    }, [clearCart]);

    return (
        <div className="max-w-3xl mx-auto px-4 py-32 text-center pt-48">
            <div className="mb-8 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                    <CheckCircle2 size={48} />
                </div>
            </div>

            <h1 className="text-5xl font-black text-text-primary mb-6 uppercase tracking-tight">
                Order <span className="text-gradient-brand">Confirmed!</span>
            </h1>

            <p className="text-text-secondary text-xl mb-12 max-w-xl mx-auto leading-relaxed">
                Thank you for your purchase! Your order has been received and is being processed for fulfillment. You will receive a confirmation email shortly.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                    href="/shop"
                    className="bg-surface-raised border border-surface-border text-text-primary px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:border-neon-cyan transition-all flex items-center gap-2"
                >
                    <ShoppingBag size={18} /> Continue Shopping
                </Link>
                <Link
                    href="/"
                    className="bg-gradient-brand text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-neon-purple hover-glow-purple transition-all flex items-center gap-2"
                >
                    Back to Home <ArrowRight size={18} />
                </Link>
            </div>

            <div className="mt-20 p-8 glass rounded-3xl border border-surface-border inline-block">
                <p className="text-text-muted text-sm font-bold uppercase tracking-[0.2em] mb-4">Need help?</p>
                <p className="text-text-secondary">Join our Discord and head to the <span className="text-neon-cyan font-bold">#support</span> channel.</p>
            </div>
        </div>
    );
}
