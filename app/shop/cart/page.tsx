"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { createCartCheckoutSession } from '@/lib/shop-actions';

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, totalAmount, itemsCount } = useCart();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCheckout = async () => {
        if (items.length === 0) return;
        setLoading(true);
        setError("");

        try {
            const checkoutItems = items.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity
            }));
            const result = await createCartCheckoutSession(checkoutItems);
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to initiate checkout");
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
                <div className="w-24 h-24 rounded-full bg-surface-raised flex items-center justify-center mb-8 border border-surface-border animate-bounce">
                    <ShoppingCart size={40} className="text-text-muted opacity-50" />
                </div>
                <h1 className="text-4xl font-black text-text-primary mb-4 uppercase tracking-tighter">Your cart is empty</h1>
                <p className="text-text-secondary mb-10 text-center max-w-md">
                    Looks like you haven&apos;t added any official GU gear yet. Check out the shop for the latest drops!
                </p>
                <Link
                    href="/shop"
                    className="bg-gradient-brand text-white px-10 py-4 rounded-xl font-black shadow-neon-purple hover-glow-purple transition-all flex items-center gap-3 uppercase tracking-widest text-sm"
                >
                    Back to Shop <ArrowRight size={20} />
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="flex flex-col lg:flex-row gap-16">

                {/* Cart Items List */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-12 border-b border-surface-border pb-8">
                        <h1 className="text-4xl md:text-5xl font-black text-text-primary uppercase tracking-tighter">
                            Shopping Cart
                        </h1>
                        <span className="bg-surface-raised px-4 py-2 rounded-full border border-surface-border text-xs font-black text-text-muted uppercase tracking-widest">
                            {itemsCount} {itemsCount === 1 ? 'Item' : 'Items'}
                        </span>
                    </div>

                    <div className="space-y-8">
                        {items.map((item) => (
                            <div
                                key={item.variantId}
                                className="group relative flex flex-col sm:flex-row gap-6 p-6 rounded-3xl bg-surface-raised/30 border border-surface-border hover:bg-surface-raised/50 transition-all"
                            >
                                {/* Image */}
                                <div className="relative w-full sm:w-32 h-40 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 border border-surface-border">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-surface-base">
                                            <ShoppingBag size={32} className="text-text-muted opacity-20" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex flex-col flex-1 justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <Link href={`/shop/${item.productId}`} className="text-xl font-black text-text-primary hover:text-neon-cyan transition-colors line-clamp-1 uppercase tracking-tight">
                                                {item.title}
                                            </Link>
                                            <p className="text-xl font-black text-neon-cyan">
                                                €{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-3 mb-4">
                                            {item.color && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted bg-surface-base px-3 py-1 rounded-full border border-surface-border">
                                                    Color: {item.color}
                                                </span>
                                            )}
                                            {item.size && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted bg-surface-base px-3 py-1 rounded-full border border-surface-border">
                                                    Size: {item.size}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 bg-surface-base rounded-xl border border-surface-border p-1">
                                            <button
                                                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                                className="p-2 text-text-muted hover:text-neon-pink transition-colors disabled:opacity-30"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                                className="p-2 text-text-muted hover:text-neon-cyan transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.variantId)}
                                            className="p-3 text-text-muted hover:text-neon-pink hover:bg-neon-pink/10 rounded-xl transition-all"
                                            title="Remove Item"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 flex items-center gap-4">
                        <Link
                            href="/shop"
                            className="text-sm font-bold text-text-muted hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="w-full lg:w-[400px]">
                    <div className="sticky top-32 glass-strong p-8 rounded-[2rem] border border-surface-border shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 blur-[80px] rounded-full -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-cyan/10 blur-[80px] rounded-full -ml-16 -mb-16"></div>

                        <h2 className="text-2xl font-black text-text-primary mb-8 uppercase tracking-tighter">Order Summary</h2>

                        <div className="space-y-6 mb-10">
                            <div className="flex justify-between items-center text-text-secondary">
                                <span className="text-sm uppercase font-bold tracking-widest">Subtotal</span>
                                <span className="font-bold">€{totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-text-secondary">
                                <span className="text-sm uppercase font-bold tracking-widest">Shipping</span>
                                <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest">Free</span>
                            </div>
                            <div className="h-[1px] bg-surface-border w-full"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-black text-text-primary uppercase tracking-tighter">Total</span>
                                <span className="text-3xl font-black text-neon-cyan">€{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-xs font-bold animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl font-black transition-all transform hover:-translate-y-1 uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${loading ? 'bg-surface-raised' : 'bg-neon-cyan text-black shadow-neon-cyan-sm hover:shadow-neon-cyan'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={24} className="animate-spin" />
                                    Processing
                                </>
                            ) : (
                                <>
                                    Checkout Now
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-center gap-4 opacity-30">
                                <div className="h-6 w-10 bg-text-muted rounded-sm"></div>
                                <div className="h-6 w-10 bg-text-muted rounded-sm"></div>
                                <div className="h-6 w-10 bg-text-muted rounded-sm"></div>
                            </div>
                            <p className="text-[10px] text-text-muted font-bold text-center uppercase tracking-widest leading-loose">
                                Payments processed securely by Stripe.<br />
                                Satisfaction guaranteed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
