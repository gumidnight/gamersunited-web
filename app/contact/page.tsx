"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Loader2 } from "lucide-react";
import siteContent from "@/content/site.json";
import { useRef, useState, useCallback } from "react";
import ReCAPTCHA from "react-google-recaptcha";

export default function ContactPage() {
    const { contact } = siteContent;
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrors({}); // Clear previous errors
        setSubmitStatus('idle'); // Reset submit status

        const formData = new FormData(e.currentTarget);
        const name = (formData.get("name") as string).trim();
        const email = (formData.get("email") as string).trim();
        const message = (formData.get("message") as string).trim();

        const newErrors: Record<string, string> = {};

        if (!name) {
            newErrors.name = "Name is required.";
        }
        if (!email) {
            newErrors.email = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email is invalid.";
        }
        if (!message) {
            newErrors.message = "Message is required.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            const token = await recaptchaRef.current?.executeAsync();
            recaptchaRef.current?.reset();

            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message, token }),
            });

            if (res.ok) {
                setSubmitStatus('success');
                // Optionally clear form fields here
                e.currentTarget.reset();
            } else {
                const data = await res.json();
                setSubmitStatus('error');
                setErrors({ form: data.error || "Failed to send message." });
            }
        } catch (error) {
            console.error(error);
            setSubmitStatus('error');
            setErrors({ form: "An unexpected error occurred. Please try again." });
        } finally {
            setIsSubmitting(false);
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
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                className={`w-full bg-surface-base border ${errors.name ? 'border-neon-pink' : 'border-surface-border'} rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-neon-cyan transition-colors`}
                                placeholder="Your name"
                            />
                            {errors.name && <p className="text-neon-pink text-xs mt-2 font-bold uppercase tracking-wider">{errors.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                className={`w-full bg-surface-base border ${errors.email ? 'border-neon-pink' : 'border-surface-border'} rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-neon-cyan transition-colors`}
                                placeholder="you@example.com"
                            />
                            {errors.email && <p className="text-neon-pink text-xs mt-2 font-bold uppercase tracking-wider">{errors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-2">
                                Message
                            </label>
                            <textarea
                                name="message"
                                id="message"
                                rows={5}
                                className={`w-full bg-surface-base border ${errors.message ? 'border-neon-pink' : 'border-surface-border'} rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-neon-cyan transition-colors resize-none`}
                                placeholder="What's on your mind?"
                            />
                            {errors.message && <p className="text-neon-pink text-xs mt-2 font-bold uppercase tracking-wider">{errors.message}</p>}
                        </div>

                        {errors.form && (
                            <p className="text-neon-pink text-sm text-center font-bold uppercase tracking-wider">{errors.form}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || submitStatus === 'success'}
                            className="w-full bg-gradient-brand text-white py-4 rounded-xl font-bold shadow-neon-purple hover-glow-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : submitStatus === 'success' ? (
                                "Message Sent!"
                            ) : (
                                "Send Message"
                            )}
                        </button>
                        <div className="flex justify-center pt-2">
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                size="invisible"
                                badge="inline"
                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                                theme="dark"
                            />
                        </div>
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
