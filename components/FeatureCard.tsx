"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { Gamepad2, Users, Newspaper, ShoppingCart, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Gamepad2,
  Users,
  Newspaper,
  ShoppingCart,
};

const accentColorMap: Record<string, string> = {
  neonCyan: "text-neon-cyan",
  neonPurple: "text-neon-purple",
  neonPink: "text-neon-pink",
  neonGreen: "text-neon-green",
};

interface FeatureCardProps {
  iconName: string;
  title: string;
  description: string;
  href: string;
  accent: string;
  variants: Variants;
}

export default function FeatureCard({
  iconName,
  title,
  description,
  href,
  accent,
  variants,
}: FeatureCardProps) {
  const Icon = iconMap[iconName] ?? Gamepad2;
  const colorClass = accentColorMap[accent] ?? "text-neon-cyan";

  // Placeholder images mapping
  const imageMap: Record<string, string> = {
    "Tournaments": "/tournaments.jpg",
    "Community": "/community.png",
    "Daily News": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200",
    "Official Merch": "/merch.jpg",
  };

  const imageUrl = imageMap[title] || "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800";

  return (
    <motion.div variants={variants} className="h-full">
      <Link href={href} className="block h-full">
        <div className="rounded-3xl bg-surface-raised border border-surface-border hover:border-surface-border-hover transition-all hover:-translate-y-2 h-full flex flex-col group overflow-hidden glass shadow-2xl">
          {/* Image Container */}
          <div className="aspect-[2/1] w-full relative overflow-hidden bg-surface-base">
            <motion.img
              src={imageUrl}
              alt={title}
              className={`w-full h-full transition-transform duration-500 group-hover:scale-110 ${title === 'Official Merch' ? 'object-cover object-[center_15%]' : 'object-cover object-center'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-transparent to-transparent opacity-60" />
          </div>

          <div className="p-10 flex flex-col flex-1">
            <div className="mb-6 bg-surface-base w-16 h-16 rounded-2xl flex items-center justify-center -mt-16 relative z-10 border border-surface-border group-hover:scale-110 transition-transform shadow-2xl">
              <Icon size={32} className={colorClass} />
            </div>
            <h2 className="text-3xl font-black mb-2 text-text-primary tracking-tight">{title}</h2>
            <p className="text-text-secondary text-lg flex-1 leading-relaxed">{description}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
