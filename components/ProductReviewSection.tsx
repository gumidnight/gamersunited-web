
"use client";

import { useState } from "react";
import { Star, MessageSquare, Send, Loader2 } from "lucide-react";
import { postProductReview } from "@/lib/shop-actions";
import Image from "next/image";

interface Review {
    id: string;
    rating: number;
    content: string;
    createdAt: Date;
    user: {
        name: string | null;
        image: string | null;
    };
}

interface ProductReviewSectionProps {
    productId: string;
    reviews: Review[];
    userSession: any;
}

export default function ProductReviewSection({ productId, reviews, userSession }: ProductReviewSectionProps) {
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!userSession) return;

        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const result = await postProductReview(productId, rating, content);
            if (result.success) {
                setSuccess(true);
                setContent("");
                setRating(5);
            } else {
                setError(result.error || "Failed to post review.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-16 pt-16 border-t border-surface-border">
            <h2 className="text-3xl font-black text-text-primary mb-10 flex items-center gap-3">
                <MessageSquare className="text-neon-cyan" /> CUSTOMER REVIEWS
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Review Form */}
                <div className="lg:col-span-1">
                    <div className="glass rounded-2xl p-8 sticky top-32">
                        <h3 className="text-xl font-bold mb-6">Write a Review</h3>

                        {userSession ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-3">
                                        Your Rating
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className={`transition-all ${rating >= star ? "text-neon-cyan" : "text-surface-border"}`}
                                            >
                                                <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-3">
                                        Your Thoughts
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        required
                                        rows={4}
                                        placeholder="Tell others what you think..."
                                        className="w-full bg-surface-base border border-surface-border rounded-xl p-4 text-text-primary focus:border-neon-cyan outline-none transition-all resize-none"
                                    />
                                </div>

                                {error && (
                                    <p className="text-neon-pink text-xs font-bold bg-neon-pink/10 p-3 rounded-lg border border-neon-pink/20">
                                        {error}
                                    </p>
                                )}

                                {success && (
                                    <p className="text-neon-green text-xs font-bold bg-neon-green/10 p-3 rounded-lg border border-neon-green/20">
                                        Review posted successfully!
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-brand text-white py-4 rounded-xl font-black shadow-neon-purple hover-glow-purple transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Post Review</>}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-text-secondary text-sm mb-4">You must be logged in to write a review.</p>
                                <a href="/api/auth/signin" className="text-neon-cyan font-bold hover:underline">Sign In with Discord</a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Review List */}
                <div className="lg:col-span-2 space-y-6">
                    {reviews.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center border-2 border-dashed border-surface-border">
                            <Star size={48} className="mx-auto text-text-muted mb-4 opacity-10" />
                            <p className="text-text-secondary italic">No reviews yet. Be the first to share your experience!</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="glass rounded-2xl p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        {review.user.image ? (
                                            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-surface-border">
                                                <Image src={review.user.image} alt={review.user.name || ""} fill />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-surface-base flex items-center justify-center border border-surface-border">
                                                <Star className="text-text-muted" size={20} />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-bold text-text-primary">{review.user.name || "Anonymous"}</div>
                                            <div className="text-xs text-text-muted">{new Date(review.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5 text-neon-cyan/80">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} size={14} fill={review.rating >= s ? "currentColor" : "none"} className={review.rating >= s ? "" : "text-surface-border"} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-text-secondary leading-relaxed">{review.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
