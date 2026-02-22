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
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="w-full max-w-7xl mx-auto mt-24 md:mt-32 grid grid-cols-1 md:grid-cols-2 gap-10 px-4 sm:px-6 lg:px-8"
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
  );
}
