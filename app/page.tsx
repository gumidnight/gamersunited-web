/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Gamepad2, Users, Newspaper, ShoppingCart } from "lucide-react";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="flex flex-col items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl mx-auto rounded-3xl bg-gray-900/50 border border-gray-800 backdrop-blur-xl p-10 md:p-20 text-center relative overflow-hidden box-shadow-neon"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#b026ff] rounded-full filter blur-[100px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00f0ff] rounded-full filter blur-[100px] opacity-20" />

        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight z-10 relative">
          LEVEL UP YOUR <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#b026ff] text-shadow-neon">
            GAMING HUB
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto relative z-10">
          The epicenter of gaming in Cyprus. Join the fastest growing esports community, catch the latest news,
          and grab exclusive merch. Welcome to Gamers United.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <Link href="/discord" className="bg-[#b026ff] hover:bg-[#9015db] text-white px-8 py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(176,38,255,0.5)] transition-all flex items-center justify-center gap-2 group w-full sm:w-auto">
            Join the Community
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/news" className="bg-transparent border border-gray-700 hover:border-[#00f0ff] hover:text-[#00f0ff] text-white px-8 py-4 rounded-xl font-bold transition-all w-full sm:w-auto text-center">
            Read Latest News
          </Link>
        </div>
      </motion.section>

      {/* Grid Features */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="w-full max-w-6xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <FeatureCard
          icon={<Gamepad2 size={32} className="text-[#00f0ff]" />}
          title="Tournaments"
          description="Compete in structured leagues and single-day events."
          href="/tournaments"
          variants={itemVariants}
        />
        <FeatureCard
          icon={<Users size={32} className="text-[#b026ff]" />}
          title="Community"
          description="Connect with teams, groups, and find local gamers."
          href="/community"
          variants={itemVariants}
        />
        <FeatureCard
          icon={<Newspaper size={32} className="text-[#ff003c]" />}
          title="Daily News"
          description="Don't miss the ultimate esports, tech & gaming updates."
          href="/news"
          variants={itemVariants}
        />
        <FeatureCard
          icon={<ShoppingCart size={32} className="text-[#00ff9d]" />}
          title="Official Merch"
          description="Rep your club. Buy high quality gaming apparel."
          href="/shop"
          variants={itemVariants}
        />
      </motion.section>
    </div>
  );
}

function FeatureCard({ icon, title, description, href, variants }: any) {
  return (
    <motion.div variants={variants}>
      <Link href={href}>
        <div className="p-8 rounded-2xl bg-[#101218] border border-gray-800 hover:border-gray-600 transition-all hover:-translate-y-2 h-full flex flex-col group">
          <div className="mb-4 bg-gray-900 w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
          <p className="text-gray-400 text-sm flex-1">{description}</p>
        </div>
      </Link>
    </motion.div>
  );
}
