"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import siteContent from "@/content/site.json";
import { useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

export default function ContactPage() {
    const { contact } = siteContent;
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const [isVerified, setIsVerified] = useState(false);

    const handleCaptchaChange = (token: string | null) => {
        setIsVerified(!!token);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16"
            >
                <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
                    GET IN <span className="text-gradient-brand">TOUCH</span>
                </h1>
                <p className="text-text-secondary text-lg max-w-xl mx-auto">
                    {contact.description}
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Contact Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="glass rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-text-primary mb-6">Send a Message</h2>
                    <form className="space-y-5" onSubmit={(e) => {
                        e.preventDefault();
                        if (!isVerified) {
                            alert("Please complete the reCAPTCHA");
                            return;
                        }
                        // Handle form submission logic here
                        alert("Message sent! (Mock)");
                    }}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                required
                                className="w-full bg-surface-base border border-surface-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-neon-cyan transition-colors"
                                placeholder="Your name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                required
                                className="w-full bg-surface-base border border-surface-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-neon-cyan transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-2">
                                Message
                            </label>
                            <textarea
                                id="message"
                                rows={5}
                                required
                                className="w-full bg-surface-base border border-surface-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-neon-cyan transition-colors resize-none"
                                placeholder="What's on your mind?"
                            />
                        </div>

                        {/* reCAPTCHA Widget */}
                        <div className="py-2 flex justify-center sm:justify-start">
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                                onChange={handleCaptchaChange}
                                theme="dark"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!isVerified}
                            className="w-full bg-gradient-brand text-white py-4 rounded-xl font-bold shadow-neon-purple hover-glow-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
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
                    <div className="glass rounded-2xl p-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-surface-base p-3 rounded-xl">
                                <Mail size={22} className="text-neon-cyan" />
                            </div>
                            <div>
                                <h3 className="text-text-primary font-bold mb-1">Email</h3>
                                <p className="text-text-secondary text-sm">{contact.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-surface-base p-3 rounded-xl">
                                <MapPin size={22} className="text-neon-purple" />
                            </div>
                            <div>
                                <h3 className="text-text-primary font-bold mb-1">Location</h3>
                                <p className="text-text-secondary text-sm">{contact.location}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-surface-base p-3 rounded-xl">
                                <Phone size={22} className="text-neon-pink" />
                            </div>
                            <div>
                                <h3 className="text-text-primary font-bold mb-1">Discord</h3>
                                <p className="text-text-secondary text-sm">
                                    {contact.discordNote.split("Discord server")[0]}
                                    <a
                                        href={contact.discordHref}
                                        className="text-neon-cyan hover:underline"
                                    >
                                        Discord server
                                    </a>
                                    .
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-brand-subtle border border-surface-border rounded-2xl p-8">
                        <h3 className="text-text-primary font-bold mb-2">
                            Partnerships &amp; Sponsorships
                        </h3>
                        <p className="text-text-secondary text-sm">
                            {contact.partnerships}
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
