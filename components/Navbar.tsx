"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Menu, X, LogIn, LogOut, Settings, Users } from "lucide-react";
import siteContent from "@/content/site.json";
import { getDiscordStatus } from "@/lib/discord-actions";

import CartIcon from "./CartIcon";

export default function Navbar() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [onlineCount, setOnlineCount] = useState<number>(0);

    useEffect(() => {
        const fetchStatus = async () => {
            const status = await getDiscordStatus();
            if (status) setOnlineCount(status.onlineCount);
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 300000); // 5 mins
        return () => clearInterval(interval);
    }, []);

    const navLinks = siteContent.nav.links;

    return (
        <nav className="sticky top-0 z-50 glass-strong border-b border-surface-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-24">
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
                            <Image
                                src="/gu-icon.png"
                                alt={siteContent.meta.siteName}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-xl"
                                priority
                            />
                            <span className="text-2xl font-black text-text-primary tracking-tighter uppercase hidden sm:block">
                                {siteContent.hero.title}
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-base font-bold text-text-secondary hover:text-text-primary hover:text-shadow-neon transition-all uppercase tracking-wider"
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Live Count Indicator */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-base border border-surface-border">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black tracking-widest text-text-secondary uppercase">
                                {onlineCount > 0 ? `${onlineCount} ONLINE` : 'GU HUB'}
                            </span>
                        </div>

                        <div className="h-8 w-[1px] bg-surface-border mx-2"></div>

                        <CartIcon />

                        {session ? (
                            <div className="flex items-center gap-6 border-l border-surface-border pl-6">
                                <div className="flex items-center gap-3">
                                    {session.user?.image && (
                                        <Image
                                            src={session.user.image}
                                            alt={`${session.user.name}'s profile picture`}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full border-2 border-neon-cyan"
                                        />
                                    )}
                                    <span className="text-base font-bold hidden lg:block">
                                        {session.user?.name}
                                    </span>
                                </div>

                                {(session.user as any) && (
                                    <Link
                                        href="/settings"
                                        className="text-text-muted hover:text-neon-cyan transition-colors"
                                        title="User Settings"
                                    >
                                        <Settings size={22} />
                                    </Link>
                                )}
                                <button
                                    onClick={() => signOut()}
                                    className="text-text-muted hover:text-neon-pink transition-colors"
                                >
                                    <LogOut size={22} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => signIn("discord")}
                                className="bg-gradient-brand text-white px-7 py-3 rounded-xl text-base font-black shadow-neon-purple hover-glow-purple transition-all flex items-center gap-2 uppercase tracking-tight"
                            >
                                <LogIn size={20} /> Login
                            </button>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center gap-6">
                        <CartIcon />
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-text-secondary hover:text-text-primary transition-colors"
                            aria-label={isOpen ? "Close menu" : "Open menu"}
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            {isOpen && (
                <div className="md:hidden glass-strong absolute w-full h-[calc(100vh-6rem)] left-0 top-24 px-6 py-8 flex flex-col justify-between overflow-y-auto z-40 bg-background/95 backdrop-blur-xl border-t border-surface-border">
                    <div className="flex flex-col space-y-8 flex-grow justify-center items-center pb-12">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className="text-2xl font-black text-text-secondary hover:text-neon-cyan hover:scale-105 transition-all outline-none uppercase tracking-[0.15em] text-center"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="pb-8">
                        {session ? (
                            <div className="pt-8 border-t border-surface-border flex flex-col items-center gap-6">
                                <div className="flex flex-col items-center gap-4">
                                    {session.user?.image && (
                                        <Image
                                            src={session.user.image}
                                            alt={`${session.user.name}'s profile picture`}
                                            width={64}
                                            height={64}
                                            className="w-16 h-16 rounded-full border-2 border-neon-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                                        />
                                    )}
                                    <span className="text-xl font-bold tracking-wide">
                                        {session.user?.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 w-full justify-center">
                                    {(session.user as any) && (
                                        <Link
                                            href="/settings"
                                            onClick={() => setIsOpen(false)}
                                            className="p-4 text-neon-cyan bg-neon-cyan/10 rounded-xl transition-colors hover:bg-neon-cyan/20"
                                            title="Settings"
                                        >
                                            <Settings size={24} />
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => signOut()}
                                        className="bg-surface-raised text-text-primary px-8 py-4 rounded-xl border border-surface-border hover:border-neon-pink hover:text-neon-pink transition-colors font-bold tracking-widest uppercase flex-1 max-w-[200px]"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => signIn("discord")}
                                className="w-full text-center bg-gradient-brand text-white py-5 rounded-xl font-black shadow-[0_0_20px_rgba(123,47,247,0.4)] tracking-wider uppercase text-lg hover:shadow-[0_0_30px_rgba(123,47,247,0.6)] transition-all"
                            >
                                Login with Discord
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
