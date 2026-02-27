"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag, Loader2, ShieldCheck, Truck, RotateCcw, X, Check } from "lucide-react";
import { useCart } from "@/lib/CartContext";

interface Variant {
    id: string;
    title: string;
    price: number;
    stock: number;
    color: string | null;
    size: string | null;
    image: string | null;
    images: string[];
}

interface Product {
    id: string;
    title: string;
    description: string;
    image: string | null;
    price: number;
    customImages?: string[];
}

export default function ProductInteractiveViewer({
    product,
    variants
}: {
    product: Product;
    variants: Variant[];
}) {
    // Collect unique colors and sizes
    const colors = Array.from(new Set(variants.map(v => v.color).filter(Boolean))) as string[];
    const sizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean))) as string[];

    // Sort sizes logically: XS, S, M, L, XL, 2XL, etc.
    const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
    sizes.sort((a, b) => {
        const indexA = sizeOrder.indexOf(a.toUpperCase());
        const indexB = sizeOrder.indexOf(b.toUpperCase());
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    const [selectedColor, setSelectedColor] = useState<string | null>(colors.length > 0 ? colors[0] : null);
    const [selectedSize, setSelectedSize] = useState<string | null>(sizes.length > 0 ? sizes[0] : null);
    const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const [error, setError] = useState("");
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

    const { addToCart } = useCart();

    // Find the variant that matches selected color and size
    let selectedVariant = variants.find(v =>
        (selectedColor ? v.color === selectedColor : true) &&
        (selectedSize ? v.size === selectedSize : true)
    );

    // Fallback if the exact color+size combo doesn't exist
    if (!selectedVariant && variants.length > 0) {
        if (selectedColor) {
            selectedVariant = variants.find(v => v.color === selectedColor);
        } else if (selectedSize) {
            selectedVariant = variants.find(v => v.size === selectedSize);
        }
        if (!selectedVariant) {
            selectedVariant = variants[0];
        }
    }

    const currentPrice = selectedVariant?.price || product.price;

    // Get images for the currently selected color
    const currentColorImages = (() => {
        const matchingVariants = selectedColor ? variants.filter(v => v.color === selectedColor) : variants;
        const imagesSet = new Set<string>();
        matchingVariants.forEach(v => {
            if (v.image) imagesSet.add(v.image);
            if (v.images && Array.isArray(v.images)) {
                v.images.forEach(img => imagesSet.add(img));
            }
        });
        if (imagesSet.size === 0 && product.image) {
            imagesSet.add(product.image);
        }

        // Add custom images to the end
        if (product.customImages && product.customImages.length > 0) {
            product.customImages.forEach(img => imagesSet.add(img));
        }

        return Array.from(imagesSet);
    })();

    // Always ensure selected gallery image is valid for the current color
    if (selectedGalleryImage && !currentColorImages.includes(selectedGalleryImage)) {
        setSelectedGalleryImage(currentColorImages[0] || null);
    }
    const displayImage = selectedGalleryImage || currentColorImages[0] || product.image;

    // Helper map for colors
    const colorMap: Record<string, string> = {
        "Black": "#111111",
        "White": "#FFFFFF",
        "Navy": "#1e3a8a",
        "Red": "#dc2626",
        "Heather Grey": "#9ca3af",
        "Dark Heather": "#4b5563",
        "Royal": "#2563eb",
        "Sport Grey": "#d1d5db",
        "Carbon Grey": "#374151"
    };

    const getColorStyle = (c: string) => {
        if (colorMap[c]) return colorMap[c];
        const normalized = c.toLowerCase().replace(/[^a-z]/g, "");
        if (["black", "white", "red", "blue", "green", "navy", "grey", "gray", "purple", "pink"].includes(normalized)) {
            return normalized;
        }
        return colorMap[c] || c;
    }

    async function handleAddToCart() {
        if (!selectedVariant) return;
        if (selectedVariant.stock <= 0) {
            setError("This variant is currently out of stock.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            addToCart({
                variantId: selectedVariant.id,
                productId: product.id,
                title: product.title,
                price: selectedVariant.price,
                image: selectedVariant.image || product.image,
                quantity: 1,
                color: selectedVariant.color,
                size: selectedVariant.size
            });

            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 3000);
        } catch (err: any) {
            console.error(err);
            setError("Failed to add to cart");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left: Image Viewer & Gallery */}
            <div className="flex flex-col gap-4">
                <div className="relative aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden glass shadow-2xl border border-surface-border group">
                    {displayImage ? (
                        <Image
                            key={displayImage}
                            src={displayImage}
                            alt={selectedVariant?.title || product.title}
                            fill
                            className="object-cover transition-opacity duration-300 animate-in fade-in zoom-in-95"
                            priority
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-raised">
                            <ShoppingBag size={80} className="text-text-muted opacity-20" />
                        </div>
                    )}
                    {/* Floating Price Tag */}
                    <div className="absolute top-6 right-6 bg-background/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-surface-border shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex flex-col items-end">
                        <span className="text-2xl font-black text-neon-cyan">€{currentPrice.toFixed(2)}</span>
                        {selectedVariant?.stock && selectedVariant.stock < 10 && (
                            <span className="text-[10px] text-neon-pink font-bold uppercase tracking-widest mt-1 animate-pulse">
                                Only {selectedVariant.stock} left!
                            </span>
                        )}
                    </div>
                </div>

                {/* Thumbnail Strip */}
                {currentColorImages.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                        {currentColorImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedGalleryImage(img)}
                                className={`
                                    relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer snap-start
                                    ${displayImage === img
                                        ? "border-neon-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-[1.02]"
                                        : "border-surface-border opacity-60 hover:opacity-100 hover:border-text-muted"
                                    }
                                `}
                            >
                                <Image
                                    src={img}
                                    alt={`Thumbnail ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                    loading="lazy"
                                    unoptimized
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Info + Purchase */}
            <div className="flex flex-col pt-4">
                <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-4 leading-tight">
                    {product.title}
                </h1>

                <div className="inline-block mb-8">
                    <span className="bg-surface-raised text-text-muted text-[10px] font-black uppercase px-4 py-2 rounded-full border border-surface-border tracking-widest">
                        Official Merch
                    </span>
                </div>

                <div className="prose prose-invert max-w-none mb-10">
                    <p className="text-text-secondary text-lg leading-relaxed">
                        {product.description.replace(/<[^>]*>?/gm, '')}
                    </p>
                </div>

                <div className="space-y-8 bg-surface-raised/50 p-8 rounded-3xl border border-surface-border backdrop-blur-sm">
                    {/* Size Selection */}
                    {sizes.length > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-xs font-black uppercase tracking-[0.2em] text-text-muted">
                                    Select Size
                                </label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setIsSizeGuideOpen(true)}
                                        className="text-xs text-text-secondary hover:text-neon-cyan underline decoration-dashed underline-offset-4 transition-colors">
                                        Size Guide
                                    </button>
                                    {selectedSize && (
                                        <span className="text-sm text-neon-cyan font-black tracking-widest">{selectedSize}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {sizes.map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`
                                            w-14 h-14 rounded-xl font-black transition-all border flex items-center justify-center
                                            ${selectedSize === size
                                                ? "bg-neon-cyan/10 border-neon-cyan text-neon-cyan shadow-[0_0_15px_rgba(34,211,238,0.2)] scale-110"
                                                : "bg-surface-base border-surface-border text-text-secondary hover:border-text-muted hover:scale-105"
                                            }
                                        `}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Color Selection */}
                    {colors.length > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-xs font-black uppercase tracking-[0.2em] text-text-muted">
                                    Select Color
                                </label>
                                {selectedColor && (
                                    <span className="text-sm text-neon-pink font-black tracking-widest">{selectedColor}</span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {colors.map(color => {
                                    const cssColor = getColorStyle(color);
                                    return (
                                        <button
                                            key={color}
                                            onClick={() => {
                                                setSelectedColor(color);
                                                setSelectedGalleryImage(null); // Reset image when color changes
                                            }}
                                            title={color}
                                            className={`
                                                w-14 h-14 rounded-full transition-all border-2 flex items-center justify-center overflow-hidden
                                                ${selectedColor === color
                                                    ? "border-neon-pink scale-110 shadow-[0_0_20px_rgba(2ec4b6,0.4)]"
                                                    : "border-text-muted hover:scale-105"
                                                }
                                            `}
                                        >
                                            <div
                                                className={`w-full h-full rounded-full border-[3px] border-[#1a1a1a]`}
                                                style={{ backgroundColor: cssColor as string }}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-sm font-bold">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-4 pt-6 mt-6 border-t border-surface-border">
                        <button
                            onClick={handleAddToCart}
                            disabled={loading || !selectedVariant || selectedVariant.stock <= 0}
                            className={`w-full py-5 rounded-2xl font-black transition-all transform hover:-translate-y-1 uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${addedToCart ? "bg-emerald-500 text-white" : "bg-neon-cyan text-background shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" /> Processing...
                                </>
                            ) : addedToCart ? (
                                <>
                                    <Check size={20} /> Added to Cart!
                                </>
                            ) : (
                                <>
                                    <ShoppingBag size={20} /> {selectedVariant?.stock && selectedVariant.stock > 0 ? `Add to Cart — €${currentPrice.toFixed(2)}` : "Out of Stock"}
                                </>
                            )}
                        </button>
                        <p className="text-center text-[10px] text-text-muted uppercase tracking-widest font-black">
                            Secure Checkout by Stripe • Free Shipping over €100
                        </p>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-surface-border">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-neon-purple/10 flex items-center justify-center text-neon-purple">
                            <ShieldCheck size={24} />
                        </div>
                        <span className="text-xs font-bold text-text-primary uppercase tracking-widest">Quality Guarantee</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 flex items-center justify-center text-neon-cyan">
                            <Truck size={24} />
                        </div>
                        <span className="text-xs font-bold text-text-primary uppercase tracking-widest">Global Shipping</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-neon-pink/10 flex items-center justify-center text-neon-pink">
                            <RotateCcw size={24} />
                        </div>
                        <span className="text-xs font-bold text-text-primary uppercase tracking-widest">30-Day Returns</span>
                    </div>
                </div>
            </div>

            {/* Size Guide Modal */}
            {isSizeGuideOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-surface-raised border border-surface-border p-6 rounded-3xl w-full max-w-md relative animate-in fade-in zoom-in-95">
                        <button
                            onClick={() => setIsSizeGuideOpen(false)}
                            className="absolute top-4 right-4 text-text-muted hover:text-neon-pink transition-colors p-2"
                        >
                            <X size={24} />
                        </button>
                        <h3 className="text-xl font-black text-text-primary mb-6 uppercase tracking-wider">Size Guide</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead>
                                    <tr className="border-b border-surface-border text-neon-cyan/70">
                                        <th className="py-3 pr-4 font-bold tracking-widest uppercase">Size</th>
                                        <th className="py-3 px-4 font-bold tracking-widest uppercase">Chest (cm)</th>
                                        <th className="py-3 pl-4 font-bold tracking-widest uppercase">Length (cm)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-surface-border/50 hover:bg-surface-border/20 transition-colors">
                                        <td className="py-3 pr-4 font-black text-text-primary">S</td><td className="py-3 px-4">86-91</td><td className="py-3 pl-4">71</td>
                                    </tr>
                                    <tr className="border-b border-surface-border/50 hover:bg-surface-border/20 transition-colors">
                                        <td className="py-3 pr-4 font-black text-text-primary">M</td><td className="py-3 px-4">96-101</td><td className="py-3 pl-4">73</td>
                                    </tr>
                                    <tr className="border-b border-surface-border/50 hover:bg-surface-border/20 transition-colors">
                                        <td className="py-3 pr-4 font-black text-text-primary">L</td><td className="py-3 px-4">106-111</td><td className="py-3 pl-4">76</td>
                                    </tr>
                                    <tr className="border-b border-surface-border/50 hover:bg-surface-border/20 transition-colors">
                                        <td className="py-3 pr-4 font-black text-text-primary">XL</td><td className="py-3 px-4">116-121</td><td className="py-3 pl-4">78</td>
                                    </tr>
                                    <tr className="hover:bg-surface-border/20 transition-colors">
                                        <td className="py-3 pr-4 font-black text-text-primary">2XL</td><td className="py-3 px-4">127-132</td><td className="py-3 pl-4">81</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-[10px] text-text-muted uppercase tracking-widest mt-6 text-center">
                            Measurements may vary by 1-2 cm depending on the product model.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
