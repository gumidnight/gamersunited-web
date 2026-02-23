"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Loader2 } from "lucide-react";
import siteContent from "@/content/site.json";
import { useRef, useState, useCallback } from "react";
import ReCAPTCHA from "react-google-recaptcha";

export default function ContactPage() {
    const { contact } = siteContent;
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);

        try {
            const token = await recaptchaRef.current?.executeAsync();
            recaptchaRef.current?.reset();
            // In a real app, you'd send this token to your backend to verify
            console.log("reCAPTCHA Token:", token);

            // Mock submission
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSubmitted(true);
            alert("Message sent! We will get back to you soon.");
        } catch (error) {
            console.error(error);
            alert("Failed to send message. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

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
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            size="invisible"
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                        />
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

                        <button
                            type="submit"
                            disabled={loading || submitted}
                            className="w-full bg-gradient-brand text-white py-4 rounded-xl font-bold shadow-neon-purple hover-glow-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Sending...</>
                            ) : submitted ? (
                                "Message Sent!"
                            ) : (
                                "Send Message"
                            )}
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
