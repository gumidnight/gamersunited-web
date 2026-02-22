import { prisma } from "@/lib/prisma";
import SyncButton from "@/components/SyncButton";
import { ShoppingBag, Tag, Box, ArrowRight } from "lucide-react";
import Image from "next/image";

export default async function AdminShopPage() {
    const products = await prisma.product.findMany({
        include: {
            variants: true
        },
        orderBy: { title: 'asc' }
    });

    return (
        <div className="p-8 max-w-6xl mx-auto mt-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-2">
                        Shop <span className="text-gradient-brand">Management</span>
                    </h1>
                    <p className="text-text-muted">
                        Sync and manage your products from Printful.
                    </p>
                </div>
                <SyncButton />
            </div>

            <div className="grid grid-cols-1 gap-6">
                {products.length === 0 ? (
                    <div className="text-center py-20 glass rounded-3xl border-2 border-dashed border-surface-border">
                        <ShoppingBag size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                        <p className="text-text-secondary font-bold text-lg">No products found in database.</p>
                        <p className="text-text-muted text-sm">Click the sync button above to pull products from Printful.</p>
                    </div>
                ) : (
                    products.map((product) => (
                        <div key={product.id} className="glass rounded-2xl overflow-hidden border border-surface-border/50 p-4 flex flex-col md:flex-row gap-6 items-center">
                            <div className="w-32 h-32 relative bg-surface-raised rounded-xl overflow-hidden flex-shrink-0">
                                {product.image ? (
                                    <Image
                                        src={product.image}
                                        alt={product.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <Box size={32} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted opacity-20" />
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold text-white">{product.title}</h3>
                                    <span className="text-xs bg-surface-overlay px-2 py-1 rounded text-text-muted border border-surface-border font-mono uppercase">
                                        ID: {product.providerId ? product.providerId.slice(-6) : 'N/A'}
                                    </span>
                                </div>
                                <p className="text-text-muted text-sm line-clamp-1 max-w-2xl">
                                    {product.description.replace(/<[^>]*>?/gm, '')}
                                </p>
                                <div className="flex flex-wrap gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                                        <Tag size={14} className="text-neon-cyan" />
                                        €{product.price.toFixed(2)} Base Price
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                                        <Box size={14} className="text-neon-purple" />
                                        {product.variants.length} Variants Available
                                    </div>
                                </div>
                            </div>

                            <button className="bg-surface-raised hover:bg-surface-overlay text-text-primary p-3 rounded-xl transition-all border border-surface-border">
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
