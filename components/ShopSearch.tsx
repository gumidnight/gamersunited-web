"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export default function ShopSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [isPending, startTransition] = useTransition();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateSearch(query);
    };

    const updateSearch = (val: string) => {
        const params = new URLSearchParams(searchParams);
        if (val) {
            params.set("q", val);
        } else {
            params.delete("q");
        }

        startTransition(() => {
            router.push(`/shop?${params.toString()}`);
        });
    };

    return (
        <div className="max-w-md mx-auto mb-16 relative group">
            <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Search
                        size={20}
                        className={`transition-colors duration-300 ${isPending ? 'text-neon-purple animate-pulse' : 'text-text-muted group-focus-within:text-neon-cyan'}`}
                    />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        // Optional: Debounced auto-search could go here
                    }}
                    placeholder="Search for hoodies, jerseys, icons..."
                    className="w-full bg-surface-base border-2 border-surface-border rounded-2xl pl-14 pr-14 py-4 text-text-primary focus:outline-none focus:border-neon-purple transition-all shadow-2xl group-hover:border-surface-border/80"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery("");
                            updateSearch("");
                        }}
                        className="absolute inset-y-0 right-5 flex items-center text-text-muted hover:text-text-primary transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </form>
            {isPending && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-neon-purple uppercase tracking-widest animate-pulse">
                    Filtering...
                </div>
            )}
        </div>
    );
}
