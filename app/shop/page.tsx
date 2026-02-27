export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { ShoppingBag } from "lucide-react";
import siteContent from "@/content/site.json";
import Image from "next/image";
import Link from "next/link";
import BestReviews from "@/components/BestReviews";
import ShopSearch from "@/components/ShopSearch";

export default async function ShopPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q } = await searchParams;
    const { shop } = siteContent;

    const products = await prisma.product.findMany({
        where: {
            isActive: true,
            ...(q ? {
                OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } }
                ]
            } : {})
        },
        include: {
            variants: {
                where: { isActive: true },
            }
        }
    });

    const pickImageUrl = (value: string | null) => {
        if (!value) return null;
        const trimmed = value.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed) && typeof parsed[0] === "string") {
                    return parsed[0];
                }
            } catch {
                // keep raw value fallback
            }
        }
        return value;
    };

    // Fetch top rated reviews (e.g., 4 and 5 stars)
    const bestReviews = await prisma.review.findMany({
        where: { rating: { gte: 4 } },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
            user: true,
            product: true
        }
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
            <div className="text-center mb-12">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4 uppercase">
                    <span className="italic">THE </span><span className="text-gradient-brand not-italic inline-block" style={{ transform: 'skewX(-12deg)' }}>DROPS</span>
                </h1>
                <p className="text-text-secondary text-lg max-w-xl mx-auto">
                    {shop.description}
                </p>
            </div>

            <ShopSearch />

            {products.length === 0 ? (
                <div className="text-center py-24 glass rounded-[2rem] border-2 border-dashed border-surface-border">
                    <ShoppingBag size={64} className="mx-auto text-text-muted mb-6 opacity-20" />
                    <p className="text-text-secondary text-2xl font-black uppercase tracking-tight">
                        {q ? `No results for "${q}"` : "The shop is being stocked!"}
                    </p>
                    <p className="text-text-muted mt-2">
                        {q ? "Try another search term or browse all items." : "Check back soon for official GU gear."}
                    </p>
                    {q && (
                        <Link href="/shop" className="inline-block mt-8 text-neon-cyan font-bold hover:underline">
                            Clear all filters
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product: any) => (
                            <div
                                key={product.id}
                                className="glass rounded-[2rem] overflow-hidden border border-surface-border/50 hover:border-neon-purple/50 transition-all duration-500 hover:-translate-y-2 group relative shadow-2xl flex flex-col"
                            >
                                <div className="h-80 bg-surface-raised flex items-center justify-center relative overflow-hidden">
                                    {pickImageUrl(product.image) ? (
                                        <Image
                                            src={pickImageUrl(product.image)!}
                                            alt={product.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-1000"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <ShoppingBag size={64} className="text-text-muted opacity-10" />
                                    )}
                                    <div className="absolute top-6 right-6 bg-surface-base/90 backdrop-blur-xl text-text-primary border border-surface-border px-5 py-3 rounded-2xl text-lg font-black shadow-2xl z-10">
                                        €{product.price.toFixed(2)}
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface-base via-transparent to-transparent opacity-80" />
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-black text-white mb-3 group-hover:text-neon-cyan transition-colors tracking-tight uppercase italic">
                                        {product.title}
                                    </h3>
                                    <p className="text-text-secondary text-sm line-clamp-2 mb-6 leading-relaxed flex-1">
                                        {product.description.replace(/<[^>]*>?/gm, '')}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {(() => {
                                            const sizes = Array.from(new Set(product.variants.map((v: any) => v.size).filter(Boolean)));
                                            const colors = Array.from(new Set(product.variants.map((v: any) => v.color).filter(Boolean)));

                                            if (sizes.length === 0 && colors.length === 0) {
                                                return product.variants.length > 0 ? (
                                                    <span className="bg-surface-raised/50 text-text-muted text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-surface-border tracking-wider">
                                                        {product.variants.length} Options
                                                    </span>
                                                ) : null;
                                            }

                                            return (
                                                <>
                                                    {sizes.length > 0 && (
                                                        <span className="bg-surface-raised/50 text-text-muted text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border border-surface-border tracking-wider flex items-center gap-1.5">
                                                            <span className="text-neon-cyan font-black">{sizes.length}</span> SIZES
                                                        </span>
                                                    )}
                                                    {colors.length > 0 && (
                                                        <span className="bg-surface-raised/50 text-text-muted text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border border-surface-border tracking-wider flex items-center gap-1.5">
                                                            <span className="text-neon-pink font-black">{colors.length}</span> COLORS
                                                        </span>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <Link href={`/shop/${product.id}`} className="block">
                                        <div className="w-full bg-surface-raised hover:bg-surface-overlay text-text-primary py-5 rounded-2xl font-black transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-surface-border group-hover:border-neon-purple/50">
                                            View Details
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Best Reviews Section */}
                    <div className="mt-32">
                        <BestReviews reviews={bestReviews} />
                    </div>
                </>
            )}
        </div>
    );
}
