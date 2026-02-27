"use client";

import { motion } from "framer-motion";
import FeatureCard from "@/components/FeatureCard";

interface Feature {
  icon: string;
  title: string;
  description: string;
  href: string;
  accent: string;
}

interface FeatureGridProps {
  features: Feature[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100 },
  },
};

export default function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <div className="relative w-[100vw] left-[calc(-50vw+50%)] py-24 md:py-32 my-12" id="preview-section">
      {/* Subtle gaming-themed background layer */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {/* Dark gradient base */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-[#0c0a15] to-background opacity-80" />

        {/* Abstract gaming texture (hexagonal grid illusion) */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(30deg, #9ca3af 12%, transparent 12.5%, transparent 87%, #9ca3af 87.5%, #9ca3af), linear-gradient(150deg, #9ca3af 12%, transparent 12.5%, transparent 87%, #9ca3af 87.5%, #9ca3af), linear-gradient(30deg, #9ca3af 12%, transparent 12.5%, transparent 87%, #9ca3af 87.5%, #9ca3af), linear-gradient(150deg, #9ca3af 12%, transparent 12.5%, transparent 87%, #9ca3af 87.5%, #9ca3af), linear-gradient(60deg, #7b2ff7 25%, transparent 25.5%, transparent 75%, #7b2ff7 75%, #7b2ff7), linear-gradient(60deg, #7b2ff7 25%, transparent 25.5%, transparent 75%, #7b2ff7 75%, #7b2ff7)`,
            backgroundSize: '80px 140px',
            backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px'
          }}
        />

        {/* Diagonal lines texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)`
          }}
        />

        {/* Focus lighting (Radial gradient) to ensure readability and direct attention */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_10%,_var(--background)_90%)]" />
      </div>

      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-4 sm:px-6 lg:px-8 relative z-10"
      >
        {features.map((feature) => (
          <FeatureCard
            key={feature.title}
            iconName={feature.icon}
            title={feature.title}
            description={feature.description}
            href={feature.href}
            accent={feature.accent}
            variants={itemVariants}
          />
        ))}
      </motion.section>
    </div>
  );
}
