"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, LogIn, LogOut } from "lucide-react";

export default function Navbar() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { label: "Home", href: "/" },
        { label: "About Us", href: "/about" },
        { label: "Community", href: "/community" },
        { label: "News", href: "/news" },
        { label: "E-Shop", href: "/shop" },
        { label: "Contact", href: "/contact" },
    ];

    return (
        <nav className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                            <Image
                                src="/logo.png"
                                alt="Gamers United"
                                width={180}
                                height={50}
                                className="h-10 w-auto"
                                priority
                                unoptimized
                            />
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="text-sm font-medium text-gray-300 hover:text-white hover:text-shadow-neon transition-all">
                                {link.label}
                            </Link>
                        ))}

                        <a href="https://discord.gg/gamersunited" target="_blank" rel="noreferrer" className="text-sm font-medium text-[#b026ff] hover:text-white transition-all">
                            Join Discord
                        </a>

                        {session ? (
                            <div className="flex items-center gap-4 border-l border-gray-700 pl-4">
                                <div className="flex items-center gap-2">
                                    <Image src={session.user?.image || ""} alt="" width={32} height={32} className="w-8 h-8 rounded-full border border-[#00f0ff]" />
                                    <span className="text-sm font-semibold hidden lg:block">{session.user?.name}</span>
                                </div>
                                <button onClick={() => signOut()} className="text-gray-400 hover:text-[#ff003c]">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => signIn("discord")} className="bg-[#b026ff] hover:bg-[#9015db] text-white px-5 py-2 rounded-md text-sm font-bold shadow-[0_0_15px_rgba(176,38,255,0.4)] transition-all flex items-center gap-2">
                                <LogIn size={16} /> Login
                            </button>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center gap-4">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-white">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            {isOpen && (
                <div className="md:hidden bg-[#0f1016] border-b border-gray-800 absolute w-full left-0 px-4 py-4 backdrop-blur-3xl">
                    <div className="flex flex-col space-y-4">
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-300 hover:text-white">
                                {link.label}
                            </Link>
                        ))}
                        <a href="https://discord.gg/gamersunited" target="_blank" rel="noreferrer" className="text-lg font-medium text-[#b026ff]">
                            Join Discord
                        </a>

                        {session ? (
                            <div className="pt-4 mt-2 border-t border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Image src={session.user?.image || ""} alt="" width={40} height={40} className="w-10 h-10 rounded-full border border-[#00f0ff]" />
                                    <span className="text-base font-semibold">{session.user?.name}</span>
                                </div>
                                <button onClick={() => signOut()} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => signIn("discord")} className="mt-4 w-full text-center bg-[#b026ff] text-white py-3 rounded-md font-bold shadow-lg">
                                Login with Discord
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
