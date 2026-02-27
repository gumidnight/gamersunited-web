import Image from "next/image";
import Link from "next/link";
import siteContent from "@/content/site.json";
import { Facebook, Instagram, Twitter, Twitch, Youtube, MessageCircle } from "lucide-react";

export default function Footer() {
    const { footer, social } = siteContent;

    const socialLinks = [
        { href: social.discord, icon: MessageCircle, label: "Discord", color: "hover:text-[#5865F2]" },
        { href: social.facebook, icon: Facebook, label: "Facebook", color: "hover:text-[#1877F2]" },
        { href: social.instagram, icon: Instagram, label: "Instagram", color: "hover:text-[#E4405F]" },
        { href: social.twitter, icon: Twitter, label: "Twitter", color: "hover:text-[#1DA1F2]" },
        { href: social.twitch, icon: Twitch, label: "Twitch", color: "hover:text-[#9146FF]" },
        { href: social.youtube, icon: Youtube, label: "Youtube", color: "hover:text-[#FF0000]" },
    ];

    return (
        <footer className="border-t border-surface-border bg-surface-base text-text-secondary py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <Image
                            src="/gu-icon.png"
                            alt={siteContent.meta.siteName}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-xl mb-6 shadow-neon-purple/20 shadow-lg"
                        />
                        <p className="text-sm max-w-xs">{footer.tagline}</p>
                    </div>
                    <div>
                        <h3 className="text-text-primary font-black mb-6 uppercase tracking-widest text-xs">Explore</h3>
                        <ul className="space-y-3 text-sm">
                            {footer.sections.explore.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="hover:text-neon-cyan transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-text-primary font-black mb-6 uppercase tracking-widest text-xs">Support</h3>
                        <ul className="space-y-3 text-sm">
                            {footer.sections.support.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        target={item.href.startsWith("http") ? "_blank" : undefined}
                                        rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                        className="hover:text-neon-purple transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-20 pt-8 flex flex-col items-center gap-8 border-t border-surface-border/30">
                    <div className="flex gap-8">
                        {socialLinks.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-text-muted transition-all duration-300 hover:scale-125 ${item.color}`}
                                aria-label={item.label}
                            >
                                <item.icon size={24} />
                            </a>
                        ))}
                    </div>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em]">
                        &copy; {new Date().getFullYear()} {footer.copyright}
                    </div>
                </div>
            </div>
        </footer>
    );
}
