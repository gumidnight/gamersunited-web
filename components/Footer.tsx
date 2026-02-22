import Image from "next/image";

export default function Footer() {
    return (
        <footer className="border-t border-gray-800 bg-[#060608] mt-20 text-gray-400 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <Image
                            src="/logo.png"
                            alt="Gamers United"
                            width={160}
                            height={44}
                            className="h-9 w-auto mb-4"
                            unoptimized
                        />
                        <p className="text-sm">
                            The premier esports and gaming community in Cyprus. Uniting players of all levels.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-4">Explore</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="/news" className="hover:text-[#00f0ff] transition-colors">Latest News</a></li>
                            <li><a href="/community" className="hover:text-[#00f0ff] transition-colors">Community</a></li>
                            <li><a href="/shop" className="hover:text-[#00f0ff] transition-colors">E-Shop</a></li>
                            <li><a href="/about" className="hover:text-[#00f0ff] transition-colors">About Us</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-4">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="/contact" className="hover:text-[#b026ff] transition-colors">Contact Us</a></li>
                            <li><a href="/faq" className="hover:text-[#b026ff] transition-colors">FAQ</a></li>
                            <li><a href="/discord" className="hover:text-[#b026ff] transition-colors">Discord Server</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="/privacy" className="hover:text-[#ff003c] transition-colors">Privacy Policy</a></li>
                            <li><a href="/terms" className="hover:text-[#ff003c] transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-xs">
                    © {new Date().getFullYear()} Gamers United Cyprus. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
