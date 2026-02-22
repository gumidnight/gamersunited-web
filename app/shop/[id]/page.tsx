export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import Link from "next/link";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";

export default async function ProductPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            variants: {
                orderBy: {
                    price: 'asc'
                }
            }
        }
    });

    if (!product) {
        notFound();
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
            <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-text-muted hover:text-neon-cyan transition-colors mb-8 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Shop
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Product Image */}
                <div className="relative aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden glass shadow-2xl border border-surface-border">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-raised">
                            <ShoppingBag size={80} className="text-text-muted opacity-20" />
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col">
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-4 leading-tight">
                        {product.title}
                    </h1>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="text-3xl font-black text-neon-cyan">
                            €{product.variants[0]?.price.toFixed(2) || product.price.toFixed(2)}
                        </div>
                        <span className="bg-surface-raised text-text-muted text-[10px] font-black uppercase px-3 py-1 rounded-full border border-surface-border tracking-widest">
                            Official Merch
                        </span>
                    </div>

                    <div className="prose prose-invert max-w-none mb-10">
                        <p className="text-text-secondary text-lg leading-relaxed">
                            {product.description.replace(/<[^>]*>?/gm, '')}
                        </p>
                    </div>

                    {/* Purchase Section (Client Component) */}
                    <ProductPurchaseSection
                        variants={product.variants.map(v => ({
                            id: v.id,
                            title: v.title,
                            price: v.price,
                            stock: v.stock
                        }))}
                    />

                    {/* Trust Badges */}
                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-surface-border">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-neon-purple/10 flex items-center justify-center text-neon-purple">
                                <ShieldCheck size={24} />
                            </div>
                            <span className="text-xs font-bold text-text-primary uppercase tracking-widest">Secure Payment</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 flex items-center justify-center text-neon-cyan">
                                <Truck size={24} />
                            </div>
                            <span className="text-xs font-bold text-text-primary uppercase tracking-widest">EU Shipping</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-neon-pink/10 flex items-center justify-center text-neon-pink">
                                <RotateCcw size={24} />
                            </div>
                            <span className="text-xs font-bold text-text-primary uppercase tracking-widest">Easy Returns</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
