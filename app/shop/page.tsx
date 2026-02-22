"use client";

import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

// Sample products — in production these come from Printify API sync
const sampleProducts = [
    {
        id: "1",
        title: "GU Classic Tee — Black",
        price: 29.99,
        image: null,
        variants: ["S", "M", "L", "XL"],
    },
    {
        id: "2",
        title: "Esports Hoodie — Neon Edition",
        price: 54.99,
        image: null,
        variants: ["S", "M", "L", "XL", "XXL"],
    },
    {
        id: "3",
        title: "GU Snapback Cap",
        price: 24.99,
        image: null,
        variants: ["One Size"],
    },
    {
        id: "4",
        title: "Pro Gaming Mousepad — XL",
        price: 19.99,
        image: null,
        variants: ["Standard"],
    },
    {
        id: "5",
        title: "GU Sticker Pack (x5)",
        price: 9.99,
        image: null,
        variants: ["Standard"],
    },
    {
        id: "6",
        title: "Limited Edition Jersey 2026",
        price: 69.99,
        image: null,
        variants: ["S", "M", "L", "XL"],
    },
];

export default function ShopPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16"
            >
                <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
                    E-<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#00ff9d]">SHOP</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-xl mx-auto">
                    Official Gamers United merchandise. Rep your community with premium gaming apparel and accessories.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {sampleProducts.map((product, i) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 * i, duration: 0.4 }}
                        className="bg-[#101218] border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-all hover:-translate-y-1 group"
                    >
                        {/* Product Image Placeholder */}
                        <div className="h-56 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                            <ShoppingBag size={40} className="text-gray-700" />
                            <div className="absolute top-3 right-3 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 px-3 py-1 rounded-full text-xs font-bold">
                                €{product.price.toFixed(2)}
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#00f0ff] transition-colors">
                                {product.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {product.variants.map((v) => (
                                    <span key={v} className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded">
                                        {v}
                                    </span>
                                ))}
                            </div>
                            <button className="w-full bg-[#b026ff] hover:bg-[#9015db] text-white py-3 rounded-lg font-bold shadow-[0_0_10px_rgba(176,38,255,0.3)] transition-all text-sm">
                                Add to Cart
                            </button>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
