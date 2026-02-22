export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { ShoppingBag } from "lucide-react";
import siteContent from "@/content/site.json";
import Image from "next/image";
import Link from "next/link";

export default async function ShopPage() {
    const { shop } = siteContent;
    const products = await prisma.product.findMany({
        include: {
            variants: true
        }
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
                <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
                    E-<span className="text-gradient-brand">SHOP</span>
                </h1>
                <p className="text-text-secondary text-lg max-w-xl mx-auto">
                    {shop.description}
                </p>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-20 glass rounded-3xl border-2 border-dashed border-surface-border">
                    <ShoppingBag size={64} className="mx-auto text-text-muted mb-4 opacity-20" />
                    <p className="text-text-secondary text-xl font-bold">The shop is currently being stocked!</p>
                    <p className="text-text-muted">Check back soon for official Gamers United merch.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="glass rounded-3xl overflow-hidden hover:border-neon-purple/50 transition-all hover:-translate-y-2 group relative shadow-2xl"
                        >
                            <div className="h-80 bg-surface-raised flex items-center justify-center relative overflow-hidden">
                                {product.image ? (
                                    <Image
                                        src={product.image}
                                        alt={product.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <ShoppingBag size={64} className="text-text-muted opacity-20" />
                                )}
                                <div className="absolute top-6 right-6 bg-black/80 backdrop-blur-xl text-white border border-white/10 px-5 py-3 rounded-2xl text-lg font-black shadow-2xl z-10">
                                    €{product.price.toFixed(2)}
                                </div>
                                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface-base via-transparent to-transparent opacity-80" />
                            </div>
                            <div className="p-8">
                                <h3 className="text-2xl font-black text-text-primary mb-3 group-hover:text-neon-cyan transition-colors tracking-tight">
                                    {product.title}
                                </h3>
                                <p className="text-text-secondary text-base line-clamp-2 mb-6 leading-relaxed">
                                    {product.description.replace(/<[^>]*>?/gm, '')}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {product.variants.slice(0, 4).map((v) => (
                                        <span
                                            key={v.id}
                                            className="bg-surface-base/50 text-text-secondary text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-surface-border tracking-wider"
                                        >
                                            {v.title}
                                        </span>
                                    ))}
                                    {product.variants.length > 4 && (
                                        <span className="text-[10px] font-black text-neon-purple self-center ml-1">
                                            +{product.variants.length - 4} MORE
                                        </span>
                                    )}
                                </div>
                                <Link href={`/shop/${product.id}`} className="block">
                                    <div className="w-full bg-gradient-brand text-white py-5 rounded-2xl font-black shadow-neon-purple hover-glow-purple transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                        <ShoppingBag size={14} /> View Details
                                    </div>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

