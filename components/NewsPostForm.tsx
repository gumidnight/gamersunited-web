"use client";

import { useRouter } from "next/navigation";

interface NewsPostFormProps {
    action: (formData: FormData) => Promise<void>;
    initialData?: {
        title: string;
        content: string;
    };
    submitLabel: string;
    titleLabel: string;
}

export default function NewsPostForm({ action, initialData, submitLabel, titleLabel }: NewsPostFormProps) {
    const router = useRouter();

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
