import { Mail } from "lucide-react";
import NewsletterForm from "./NewsletterForm";

export default function NewsletterSection() {
    return (
        <section className="relative py-24 overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-neon-purple/10 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-neon-cyan/5 rounded-full blur-[80px]" />
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="glass rounded-[2rem] p-10 md:p-14 border border-surface-border/50 hover:border-neon-purple/20 transition-colors duration-500 shadow-2xl">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-brand mb-6 shadow-neon-purple-lg">
                            <Mail size={24} className="text-white" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-text-primary uppercase tracking-tight mb-3">
                            Join the <span className="text-gradient-brand">Hub</span>
                        </h2>
                        <p className="text-text-muted text-sm md:text-base max-w-md mx-auto mb-10">
                            Get early access to drops, news, and exclusive tournament updates.
                        </p>
                        <NewsletterForm />
                    </div>
                </div>
            </div>
        </section>
    );
}
