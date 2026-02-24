"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function AdminEditProductPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [id, setId] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [customImages, setCustomImages] = useState<string[]>([]);
    const [newImageUrl, setNewImageUrl] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        // Next 15+ compatible params parsing
        Promise.resolve(params).then((p) => {
            setId(p.id);
        });
    }, [params]);

    useEffect(() => {
        if (!id) return;

        fetch(`/api/products/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setProduct(data.data);
                    setCustomImages(data.data.customImages || []);
                    setDescription(data.data.description || "");
                }
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, [id]);

    const addImage = () => {
        if (!newImageUrl.trim()) return;
        setCustomImages([...customImages, newImageUrl.trim()]);
        setNewImageUrl("");
    };

    const removeImage = (index: number) => {
        setCustomImages(customImages.filter((_, i) => i !== index));
    };

    const moveImage = (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index > 0) {
            const newImages = [...customImages];
            [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
            setCustomImages(newImages);
        } else if (direction === 'right' && index < customImages.length - 1) {
            const newImages = [...customImages];
            [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
            setCustomImages(newImages);
        }
    };

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) return;
        const newImages = [...customImages];
        const draggedItem = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(targetIndex, 0, draggedItem);
        setCustomImages(newImages);
        setDraggedIndex(null);
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customImages, description })
            });
            if (res.ok) {
                alert("Settings saved successfully!");
                router.refresh();
            } else {
                alert("Failed to save settings.");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-neon-cyan" size={48} />
            </div>
        );
    }

    if (!product) {
        return <div className="text-center p-10 text-xl font-bold">Product not found.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8"
            >
                <ArrowLeft size={16} /> Back to Shop
            </button>

            <h1 className="text-3xl font-black uppercase tracking-wider mb-8 flex items-center gap-4">
                Edit Product
            </h1>

            <div className="glass rounded-3xl p-8 space-y-8 border border-surface-border">
                {/* Product Info */}
                <div className="flex items-start gap-6 border-b border-surface-border pb-8">
                    <div className="w-24 h-24 relative bg-surface-raised rounded-xl overflow-hidden shrink-0">
                        {product.image && (
                            <Image src={product.image} alt={product.title} fill className="object-cover" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wide">{product.title}</h2>
                        <span className="text-sm font-mono text-neon-pink">ID: {product.providerId}</span>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-text-muted mb-2">Description / Details</label>
                    <textarea
                        className="w-full h-32 bg-surface-base border border-surface-border rounded-xl p-4 text-text-primary focus:border-neon-cyan outline-none transition-colors"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter the product details/description..."
                    />
                </div>

                {/* Custom Images */}
                <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-text-muted mb-2">Secondary / Custom Images</label>
                    <p className="text-xs text-text-secondary mb-4">You can paste any CDN image URL (like Discord, your Cloudflare R2 bucket...) to use for this product's carousel. <span className="text-white font-bold">Drag and drop images, or use the arrows to re-order them.</span></p>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="url"
                            className="flex-1 bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-text-primary focus:border-neon-purple outline-none"
                            placeholder="https://..."
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addImage();
                                }
                            }}
                        />
                        <button
                            onClick={addImage}
                            className="bg-neon-purple text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-neon-pink transition-colors flex items-center gap-2"
                        >
                            <Plus size={18} /> Add
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {product.image && (
                            <div className="relative aspect-square rounded-xl overflow-hidden opacity-50 border-2 border-surface-border">
                                <Image src={product.image} alt="Main Image" fill className="object-cover" />
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-center uppercase tracking-widest p-1">Main Image</div>
                            </div>
                        )}

                        {customImages.map((img, i) => (
                            <div
                                key={i}
                                draggable
                                onDragStart={(e) => handleDragStart(e, i)}
                                onDragOver={(e) => handleDragOver(e, i)}
                                onDrop={(e) => handleDrop(e, i)}
                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-move group hover:border-neon-pink ${draggedIndex === i ? 'opacity-50 border-neon-cyan scale-95' : 'border-surface-border'}`}
                            >
                                <Image src={img} alt={`Custom Image ${i + 1}`} fill className="object-cover pointer-events-none" />

                                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {i > 0 && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); moveImage(i, 'left'); }}
                                            className="bg-black/80 hover:bg-neon-cyan p-1.5 rounded-full text-white backdrop-blur transition-colors"
                                            title="Move Left"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                    )}
                                    {i < customImages.length - 1 && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); moveImage(i, 'right'); }}
                                            className="bg-black/80 hover:bg-neon-cyan p-1.5 rounded-full text-white backdrop-blur transition-colors"
                                            title="Move Right"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                                    className="absolute top-2 right-2 bg-black/80 hover:bg-neon-pink p-1.5 rounded-full text-white backdrop-blur transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <X size={14} />
                                </button>
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-center uppercase tracking-widest p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Drag to Reorder
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-surface-border flex justify-end">
                    <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="bg-neon-cyan text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-neon-cyan flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
