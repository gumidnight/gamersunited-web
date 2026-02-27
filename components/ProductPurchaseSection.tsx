"use client";

import { useState } from "react";
import { ShoppingBag, Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/lib/shop-actions";

interface Variant {
    id: string;
    title: string;
    price: number;
    stock: number;
}

export default function ProductPurchaseSection({ variants }: { variants: Variant[] }) {
    const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const selectedVariant = variants.find(v => v.id === selectedVariantId);

    async function handleBuy() {
        if (!selectedVariantId) return;

        setLoading(true);
        setError("");

        try {
            const result = await createCheckoutSession(selectedVariantId);
            if (result.error) {
                setError(result.error);
                setLoading(false);
                return;
            }
            if (result.url) {
                window.location.href = result.url;
                return;
            }
            setError("Failed to initiate checkout");
            setLoading(false);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            {/* Variant Selection */}
            {variants.length > 1 && (
                <div>
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-text-muted mb-4">
                        Select Option
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {variants.map((v) => {
                            // Extract size from title (e.g., "Hoodie - S", "Black / XL", "S")
                            const sizeParts = v.title.split(/[\-\/]/).map(s => s.trim());
                            const possibleSize = sizeParts[sizeParts.length - 1]; // usually the last part is the size
                            const displaySize = `/${possibleSize.toUpperCase()}`;

                            return (
                                <button
                                    key={v.id}
                                    onClick={() => setSelectedVariantId(v.id)}
                                    className={`
                                        px-6 py-3 rounded-xl font-bold transition-all border
                                        ${selectedVariantId === v.id
                                            ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                                            : "bg-surface-base border-surface-border text-text-secondary hover:border-text-muted"
                                        }
                                    `}
                                >
                                    {displaySize}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Price section if different variants have different prices */}
            {selectedVariant && variants.length > 1 && (
                <div className="text-xl font-black text-text-primary">
                    Selected Price: €{selectedVariant.price.toFixed(2)}
                </div>
            )}

            {error && (
                <div className="p-4 rounded-xl bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-sm font-bold">
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 pt-4">
                <button
                    onClick={handleBuy}
                    disabled={loading || !selectedVariantId}
                    className="w-full bg-gradient-brand text-white py-6 rounded-2xl font-black shadow-neon-purple hover-glow-purple transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> Processing...
                        </>
                    ) : (
                        <>
                            <ShoppingBag size={20} /> Buy Now
                        </>
                    )}
                </button>
                <p className="text-center text-[10px] text-text-muted uppercase tracking-widest font-black">
                    Secure Checkout powered by Stripe
                </p>
            </div>
        </div>
    );
}
