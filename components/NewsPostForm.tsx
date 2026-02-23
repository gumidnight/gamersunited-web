"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { ImageIcon, X } from "lucide-react";

interface NewsPostFormProps {
    action: (formData: FormData) => Promise<void>;
    initialData?: {
        title: string;
        content: string;
        coverImage?: string | null;
    };
    submitLabel: string;
    titleLabel: string;
}

export default function NewsPostForm({ action, initialData, submitLabel, titleLabel }: NewsPostFormProps) {
    const router = useRouter();
    const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImage || "");

    return (
        <form action={action} className="glass rounded-xl p-8 space-y-6">
            <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-text-muted">
                    Article Title
                </label>
                <input
                    name="title"
                    type="text"
                    required
                    defaultValue={initialData?.title}
                    placeholder="Enter a catchy title..."
                    className="w-full bg-surface-base border border-surface-border rounded-lg p-4 text-text-primary focus:border-neon-purple outline-none transition-all"
                />
            </div>

            <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-text-muted">
                    Cover Image URL
                </label>
                <div className="space-y-4">
                    <input
                        name="coverImage"
                        type="url"
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-surface-base border border-surface-border rounded-lg p-4 text-text-primary focus:border-neon-purple outline-none transition-all"
                    />

                    {coverImageUrl && (
                        <div className="relative aspect-video w-full max-w-md rounded-xl overflow-hidden border border-surface-border">
                            <img
                                src={coverImageUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={() => setCoverImageUrl("")}
                            />
                            <button
                                type="button"
                                onClick={() => setCoverImageUrl("")}
                                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    {!coverImageUrl && (
                        <div className="aspect-video w-full max-w-md rounded-xl border-2 border-dashed border-surface-border flex flex-col items-center justify-center text-text-muted">
                            <ImageIcon size={48} className="mb-2 opacity-20" />
                            <p className="text-xs uppercase font-bold">No Image Selected</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-text-muted">
                    Content (Markdown supported)
                </label>
                <textarea
                    name="content"
                    required
                    rows={15}
                    defaultValue={initialData?.content}
                    placeholder="Write your article content here..."
                    className="w-full bg-surface-base border border-surface-border rounded-lg p-4 text-text-primary focus:border-neon-purple outline-none transition-all font-mono"
                />
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    type="submit"
                    className="bg-gradient-brand text-white px-8 py-4 rounded-xl font-bold shadow-neon-purple hover-glow-purple transition-all"
                >
                    {submitLabel}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="border border-surface-border text-text-muted hover:text-text-primary px-8 py-4 rounded-xl font-bold transition-all"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
