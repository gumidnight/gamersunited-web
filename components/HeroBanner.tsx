"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Gamepad2, Trophy, Target, Cpu, Mouse, Headphones, Shield, Swords } from "lucide-react";
import { getDiscordStatus } from "@/lib/discord-actions";

interface HeroBannerProps {
  title: string;
  subtitle: string;
  description: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
}

function FloatingIcon({ icon: Icon, className, delay = 0, duration = 5 }: { icon: any, className: string, delay?: number, duration?: number }) {
  return (
    <motion.div
      className={`absolute opacity-20 text-neon-purple blur-[1px] pointer-events-none hidden lg:block ${className}`}
      initial={{ y: 0, rotate: 0 }}
      animate={{
        y: [0, -20, 0],
        rotate: [-5, 5, -5]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
    >
      <Icon size={120} strokeWidth={1} />
    </motion.div>
  );
}

function NeonScanner() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
      <motion.div
        className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-neon-purple to-transparent opacity-20"
        animate={{
          left: ['0%', '100%']
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-neon-cyan to-transparent opacity-20"
        animate={{
          right: ['0%', '100%']
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
          delay: 2
        }}
      />
    </div>
  );
}

function FloatingGamingIcons() {
  return (
    <>
      <NeonScanner />
      {/* Left Side */}
      <FloatingIcon icon={Gamepad2} className="left-[5%] top-[20%] font-black -rotate-12" delay={0} duration={6} />
      <FloatingIcon icon={Swords} className="left-[10%] bottom-[25%] rotate-12" delay={1} duration={7} />
      <FloatingIcon icon={Trophy} className="left-[2%] bottom-[45%] -rotate-6" delay={2} duration={5} />

      {/* Right Side */}
      <FloatingIcon icon={Headphones} className="right-[5%] top-[25%] rotate-12" delay={0.5} duration={6.5} />
      <FloatingIcon icon={Target} className="right-[10%] bottom-[30%] -rotate-12" delay={1.5} duration={7.5} />
      <FloatingIcon icon={Shield} className="right-[3%] bottom-[50%] rotate-6" delay={2.5} duration={5.5} />
    </>
  );
}

function GlowOrb({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(123, 47, 247, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(123, 47, 247, 0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radial fade */}
      <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-transparent to-surface-base" />
    </div>
  );
}

function ParticleField() {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 4 + 4,
      }))
    );
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-neon-purple"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function HeroBanner({
  title,
  subtitle,
  description,
  ctaPrimary,
  ctaSecondary,
}: HeroBannerProps) {
  const [onlineCount, setOnlineCount] = useState<number>(0);

  useEffect(() => {
    const fetchStatus = async () => {
      const status = await getDiscordStatus();
      if (status) {
        setOnlineCount(status.onlineCount);
      }
    };
    fetchStatus();
    // Refresh every 2 minutes
    const interval = setInterval(fetchStatus, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=2071"
          alt="Hero Background"
          fill
          priority
          className="object-cover opacity-45 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-base/70 via-surface-base/20 to-surface-base" />
        <div className="absolute inset-0 bg-surface-base/10" />
      </div>

      {/* Background layers */}
      <GridBackground />
      <ParticleField />
      <FloatingGamingIcons />

      {/* Glow orbs */}
      <GlowOrb
        className="w-[500px] h-[500px] bg-neon-purple -top-40 -left-40"
        delay={0}
      />
      <GlowOrb
        className="w-[400px] h-[400px] bg-neon-cyan -bottom-32 -right-32"
        delay={2}
      />
      <GlowOrb
        className="w-[300px] h-[300px] bg-neon-purple/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        delay={4}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-20">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <Image
            src="/full-logo.png"
            alt={title}
            width={400}
            height={120}
            className="w-[280px] sm:w-[340px] md:w-[400px] h-auto drop-shadow-[0_0_30px_rgba(123,47,247,0.4)]"
            priority
          />
        </motion.div>

        {/* Subtitle badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <span className="inline-block px-7 py-3 rounded-full text-sm font-black tracking-[0.2em] uppercase border-2 border-neon-purple/60 bg-neon-purple/10 text-neon-purple-light shadow-[0_0_20px_rgba(123,47,247,0.2)]">
            {subtitle}
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6 font-[var(--font-heading)] uppercase italic"
        >
          YOUR GAME. <br className="hidden sm:block" />
          <span className="text-gradient-brand">OUR DOMAINE.</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-text-secondary text-base sm:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed"
        >
          {description}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-20"
        >
          <a
            href={ctaPrimary.href}
            target="_blank"
            rel="noreferrer"
            className="bg-gradient-brand text-white px-8 py-4 rounded-xl font-bold shadow-neon-purple hover-glow-purple transition-all flex items-center justify-center gap-2 group w-full sm:w-auto"
          >
            {ctaPrimary.label}
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
          <a
            href={ctaSecondary.href}
            className="border border-surface-border hover:border-neon-cyan text-text-primary hover:text-neon-cyan px-8 py-4 rounded-xl font-bold transition-all w-full sm:w-auto text-center hover-glow-cyan"
          >
            {ctaSecondary.label}
          </a>
        </motion.div>

        {/* Scroll indicator (Fixed position) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-4"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-neon-purple/20 flex items-start justify-center p-1.5"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-neon-purple" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
