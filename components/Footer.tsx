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
        <footer className="border-t border-surface-border bg-surface-base mt-20 text-text-secondary py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <Image
                            src="/gu-icon.png"
                            alt={siteContent.meta.siteName}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-lg mb-4"
                        />
                        <p className="text-sm">{footer.tagline}</p>
                    </div>
                    <div>
                        <h3 className="text-text-primary font-bold mb-4">Explore</h3>
                        <ul className="space-y-2 text-sm">
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
                        <h3 className="text-text-primary font-bold mb-4">Support</h3>
                        <ul className="space-y-2 text-sm">
                            {footer.sections.support.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="hover:text-neon-purple transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-text-primary font-bold mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            {footer.sections.legal.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="hover:text-neon-pink transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="border-t border-surface-border mt-12 pt-8 flex flex-col items-center gap-6">
                    <div className="flex gap-6">
                        {socialLinks.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                target="_blank"
                                rel="noreferrer"
                                className={`text-text-muted transition-all duration-300 hover:scale-110 ${item.color}`}
                                aria-label={item.label}
                            >
                                <item.icon size={22} />
                            </a>
                        ))}
                    </div>
                    <div className="text-xs text-text-muted">
                        &copy; {new Date().getFullYear()} {footer.copyright}
                    </div>
                </div>
            </div>
        </footer>
    );
}
