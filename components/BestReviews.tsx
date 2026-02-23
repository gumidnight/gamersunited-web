
import { Star, Quote } from "lucide-react";
import Image from "next/image";

interface BestReview {
    id: string;
    rating: number;
    content: string;
    user: {
        name: string | null;
        image: string | null;
    };
    product: {
        title: string;
    };
}

export default function BestReviews({ reviews }: { reviews: BestReview[] }) {
    if (reviews.length === 0) return null;

    return (
        <section className="mt-32">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 uppercase">
                    Trusted by the <span className="text-gradient-brand">Community</span>
                </h2>
                <p className="text-text-secondary max-w-xl mx-auto">
                    Check out what fellow gamers have to say about our official gear.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {reviews.map((review) => (
                    <div key={review.id} className="glass rounded-3xl p-8 relative group hover:border-neon-cyan/30 transition-all">
                        <Quote className="absolute top-6 right-8 text-surface-border group-hover:text-neon-cyan/20 transition-colors" size={40} />

                        <div className="flex gap-0.5 text-neon-cyan mb-6">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={16} fill={review.rating >= s ? "currentColor" : "none"} />
                            ))}
                        </div>

                        <p className="text-text-primary mb-8 line-clamp-4 leading-relaxed italic">
                            "{review.content}"
                        </p>

                        <div className="flex items-center gap-4 border-t border-surface-border pt-6 mt-auto">
                            {review.user.image ? (
                                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-surface-border">
                                    <Image src={review.user.image} alt={review.user.name || "User"} fill />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-surface-base flex items-center justify-center border border-surface-border">
                                    <Star className="text-text-muted" size={16} />
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-bold text-text-primary">{review.user.name || "Anonymous"}</div>
                                <div className="text-[10px] font-black text-neon-purple uppercase tracking-widest">{review.product.title}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
