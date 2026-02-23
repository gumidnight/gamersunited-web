"use client";

import { Heart, Instagram } from "lucide-react";
import Image from "next/image";

const instaPosts = [
    { id: 1, image: "/ig-1.jpg", likes: "1.2k" },
    { id: 2, image: "/ig-2.jpg", likes: "856" },
    { id: 3, image: "/ig-3.jpg", likes: "2.1k" },
    { id: 4, image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070", likes: "1.5k" },
    { id: 5, image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=2071", likes: "943" },
    { id: 6, image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=1957", likes: "2.8k" },
    { id: 7, image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=2070", likes: "612" },
    { id: 8, image: "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&q=80&w=2070", likes: "1.1k" },
    { id: 9, image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&q=80&w=2070", likes: "4.2k" }
];

export default function InstagramFeed() {
    return (
        <section className="mb-24">
            <div className="glass rounded-[2rem] p-6 md:p-12 overflow-hidden border border-surface-border">
                {/* Header Style - Dark & Aggressive */}
                <div className="mb-12 text-left">
                    <div className="flex items-center gap-3 text-neon-pink text-[10px] font-black tracking-[0.4em] uppercase mb-4">
                        <Instagram size={14} /> @gamersunitedcy
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-text-primary mb-4 leading-tight uppercase italic tracking-tighter">
                        COMMUNITY <span className="text-neon-cyan">JOURNAL</span>
                    </h2>
                    <p className="text-text-secondary text-lg max-w-2xl leading-relaxed">
                        The heartbeat of Cyprus gaming. Captured live. Don't miss a single highlight from our tournaments and community nights.
                    </p>
                </div>

                {/* The Widget Box - Integrated Dark Theme */}
                <div className="bg-black/40 border border-surface-border rounded-3xl overflow-hidden shadow-2xl">
                    {/* Profile Header */}
                    <div className="flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 bg-surface-base/50 border-b border-surface-border gap-6 sm:gap-8">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
                                <div className="w-full h-full rounded-full border-4 border-black overflow-hidden bg-black relative">
                                    <Image
                                        src="https://instagram.fnic5-1.fna.fbcdn.net/v/t51.2885-19/503988445_18063246317125792_4085789832816401956_n.jpg?stp=dst-jpg_s320x320_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fnic5-1.fna.fbcdn.net&_nc_cat=104&_nc_oc=Q6cZ2QEYKEjQGwuPpDelwOcdeuz1-zGZrypYELdn_p90AK7DtnU5QT2hW-DLDOx_pKssaKU&_nc_ohc=AuIDGsENdycQ7kNvwHsuHy9&_nc_gid=NzQihiBoCdrIN1zo2jeVYg&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfvGJCDspJhFp-uP-YAljPuz2pJUBj6_a3kbPGQ0UgBMQw&oe=69A104D8&_nc_sid=8b3546"
                                        alt="Profile"
                                        fill
                                        sizes="80px"
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-black text-text-primary leading-none mb-2 tracking-tight">gamersunitedcy</h3>
                                <p className="text-sm text-text-secondary font-bold">Gamers United</p>
                                <div className="flex gap-6 mt-3">
                                    <div className="text-sm text-text-primary"><strong>948</strong> <span className="text-text-muted font-medium ml-1">followers</span></div>
                                    <div className="text-sm text-text-primary"><strong>98</strong> <span className="text-text-muted font-medium ml-1">posts</span></div>
                                </div>
                            </div>
                        </div>
                        <a
                            href="https://www.instagram.com/gamersunitedcy/"
                            target="_blank"
                            rel="noreferrer"
                            className="bg-neon-pink hover:bg-neon-pink/80 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-neon-pink/20"
                        >
                            Follow Community
                        </a>
                    </div>

                    {/* Post Grid */}
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 p-1 sm:p-2">
                        {instaPosts.map((post) => (
                            <a
                                key={post.id}
                                href="https://www.instagram.com/gamersunitedcy/"
                                target="_blank"
                                rel="noreferrer"
                                className="group relative aspect-square overflow-hidden rounded-lg bg-surface-base"
                            >
                                <Image
                                    src={post.image}
                                    alt="Instagram post"
                                    fill
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 text-white font-black text-lg">
                                    <div className="flex items-center gap-2">
                                        <Heart size={24} fill="white" />
                                        <span>{post.likes}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <a
                        href="https://www.instagram.com/gamersunitedcy/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted hover:text-neon-cyan transition-colors border-b border-surface-border pb-1"
                    >
                        View Full Gallery
                    </a>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Live Sync Active</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
