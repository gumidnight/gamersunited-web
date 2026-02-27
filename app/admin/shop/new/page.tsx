"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";

interface VariantInput {
    title: string;
    price: string;
    stock: string;
    color: string;
    size: string;
    image: string;
}

export default function CreateCustomProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [image, setImage] = useState("");

    const [variants, setVariants] = useState<VariantInput[]>([
        { title: "", price: "", stock: "0", color: "", size: "", image: "" }
    ]);

    const addVariant = () => {
        setVariants([...variants, { title: "", price: "", stock: "0", color: "", size: "", image: "" }]);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index: number, field: keyof VariantInput, value: string) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !price) {
            alert("Please fill in the required fields (Title and Price).");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    price,
                    image,
                    variants: variants.filter(v => v.title || v.color || v.size) // Only send non-empty variants
                })
            });

            if (res.ok) {
                alert("Product created successfully!");
                router.push("/admin/shop");
                router.refresh();
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || "Failed to create product"}`);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Shop
            </button>

            <h1 className="text-4xl font-black uppercase tracking-tight mb-8">
                Create <span className="text-gradient-brand">Custom Product</span>
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="glass rounded-3xl p-8 border border-surface-border space-y-6">
                    <h2 className="text-xl font-bold text-white border-b border-surface-border pb-4 mb-4">Basic Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Product Title *</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-text-primary focus:border-neon-cyan outline-none transition-colors"
                                placeholder="e.g. GU Legacy Hoodie"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Base Price (€) *</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-text-primary focus:border-neon-purple outline-none transition-colors"
                                placeholder="29.99"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-32 bg-surface-base border border-surface-border rounded-xl p-4 text-text-primary focus:border-neon-pink outline-none transition-colors"
                            placeholder="Tell more about the product..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Main Image URL</label>
                        <div className="flex gap-4">
                            <input
                                type="url"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                className="flex-1 bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-text-primary focus:border-neon-cyan outline-none transition-colors"
                                placeholder="https://..."
                            />
                            {image && (
                                <div className="w-12 h-12 relative rounded-lg overflow-hidden border border-surface-border shrink-0">
                                    <Image src={image} alt="Preview" fill className="object-cover" unoptimized />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="glass rounded-3xl p-8 border border-surface-border space-y-6">
                    <div className="flex justify-between items-center border-b border-surface-border pb-4 mb-4">
                        <h2 className="text-xl font-bold text-white">Variants & Options</h2>
                        <button
                            type="button"
                            onClick={addVariant}
                            className="text-xs bg-surface-overlay hover:bg-surface-border text-neon-cyan px-4 py-2 rounded-lg font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-surface-border"
                        >
                            <Plus size={14} /> Add Variant
                        </button>
                    </div>

                    <p className="text-xs text-text-muted mb-6">
                        Add different sizes, colors, or specific variant photos. If price is left empty, it will use the base price.
                    </p>

                    <div className="space-y-4">
                        {variants.map((v, i) => (
                            <div key={i} className="bg-surface-base/50 p-6 rounded-2xl border border-surface-border relative group">
                                <button
                                    type="button"
                                    onClick={() => removeVariant(i)}
                                    className="absolute -top-2 -right-2 bg-background border border-surface-border text-text-muted hover:text-neon-pink p-1.5 rounded-full transition-colors z-10 opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-text-muted">Variant Name</label>
                                        <input
                                            type="text"
                                            value={v.title}
                                            onChange={(e) => updateVariant(i, "title", e.target.value)}
                                            className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-neon-cyan outline-none"
                                            placeholder="Black / L"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-text-muted">Color</label>
                                        <input
                                            type="text"
                                            value={v.color}
                                            onChange={(e) => updateVariant(i, "color", e.target.value)}
                                            className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-neon-cyan outline-none"
                                            placeholder="Black"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-text-muted">Size</label>
                                        <input
                                            type="text"
                                            value={v.size}
                                            onChange={(e) => updateVariant(i, "size", e.target.value)}
                                            className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-neon-cyan outline-none"
                                            placeholder="L"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-text-muted">Price</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={v.price}
                                            onChange={(e) => updateVariant(i, "price", e.target.value)}
                                            className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-neon-cyan outline-none"
                                            placeholder="Inherit"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-text-muted">Stock</label>
                                        <input
                                            type="number"
                                            value={v.stock}
                                            onChange={(e) => updateVariant(i, "stock", e.target.value)}
                                            className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-neon-cyan outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-text-muted">Image URL</label>
                                        <input
                                            type="url"
                                            value={v.image}
                                            onChange={(e) => updateVariant(i, "image", e.target.value)}
                                            className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-neon-cyan outline-none"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-neon-cyan text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-neon-cyan flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {loading ? "Creating..." : "Create Product"}
                    </button>
                </div>
            </form>
        </div>
    );
}
