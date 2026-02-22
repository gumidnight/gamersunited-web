import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Newspaper, Users, LayoutDashboard, ShoppingBag } from "lucide-react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user || (session.user as any).role !== "ADMIN") {
        redirect("/");
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin/news', icon: LayoutDashboard },
        { name: 'News Management', href: '/admin/news', icon: Newspaper },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Shop Management', href: '/admin/shop', icon: ShoppingBag },
    ];

    return (
        <div className="min-h-screen bg-surface-base">
            <div className="flex pt-20">
                {/* Sidebar */}
                <aside className="w-64 fixed left-0 top-20 bottom-0 glass-strong border-r border-surface-border hidden lg:block">
                    <div className="p-6">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-6 px-3">
                            Admin Menu
                        </p>
                        <nav className="space-y-2">
                            {navigation.map((item, idx) => {
                                // Simple way to group News Management for now
                                if (idx === 0) return null; // Skip dashboard placeholder
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-all"
                                    >
                                        <item.icon size={18} />
                                        <span className="font-semibold text-sm">{item.name}</span>
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 lg:ml-64 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
