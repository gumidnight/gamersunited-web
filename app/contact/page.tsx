"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16"
            >
                <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
                    GET IN <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#b026ff]">TOUCH</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-xl mx-auto">
                    Have a question, partnership proposal, or just want to say hi? We&apos;d love to hear from you.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Contact Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="bg-[#101218] border border-gray-800 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-6">Send a Message</h2>
                    <form className="space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                            <input
                                type="text"
                                id="name"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
                                placeholder="Your name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                id="email"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                            <textarea
                                id="message"
                                rows={5}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors resize-none"
                                placeholder="What's on your mind?"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-[#b026ff] hover:bg-[#9015db] text-white py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(176,38,255,0.4)] transition-all"
                        >
                            Send Message
                        </button>
                    </form>
                </motion.div>

                {/* Contact Info */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="space-y-6"
                >
                    <div className="bg-[#101218] border border-gray-800 rounded-2xl p-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-gray-900 p-3 rounded-xl">
                                <Mail size={22} className="text-[#00f0ff]" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-1">Email</h3>
                                <p className="text-gray-400 text-sm">info@gamersunited.cy</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#101218] border border-gray-800 rounded-2xl p-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-gray-900 p-3 rounded-xl">
                                <MapPin size={22} className="text-[#b026ff]" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-1">Location</h3>
                                <p className="text-gray-400 text-sm">Nicosia, Cyprus</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#101218] border border-gray-800 rounded-2xl p-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-gray-900 p-3 rounded-xl">
                                <Phone size={22} className="text-[#ff003c]" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-1">Discord</h3>
                                <p className="text-gray-400 text-sm">The fastest way to reach us is through our <a href="https://discord.gg/gamersunited" className="text-[#00f0ff] hover:underline">Discord server</a>.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#00f0ff]/5 to-[#b026ff]/5 border border-gray-800 rounded-2xl p-8">
                        <h3 className="text-white font-bold mb-2">Partnerships & Sponsorships</h3>
                        <p className="text-gray-400 text-sm">
                            Interested in partnering with Gamers United? We&apos;re always open to collaborations with brands,
                            organizations, and event organizers. Reach out via email for business inquiries.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
