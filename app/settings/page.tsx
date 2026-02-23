export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { User, Package, ShieldCheck, Mail, Calendar } from "lucide-react";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/");
    }

    const userId = (session.user as any).id;
    if (!userId) {
        redirect("/");
    }

    // Fetch user details
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        redirect("/");
    }

    // Fetch orders separately to avoid relation sync issues in Prisma Client
    let orders = [];
    try {
        orders = await (prisma as any).order.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: { items: true }
        });
    } catch (error) {
        console.error("Order fetch error:", error);
    }

    const isAdmin = (session.user as any).role === "ADMIN" || user.role === "ADMIN";

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 mt-24 text-text-primary">
            <h1 className="text-4xl font-black text-gradient-brand mb-8 uppercase tracking-tight">
                Account Settings
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="glass rounded-2xl p-6 text-center">
                        <div className="relative w-24 h-24 mx-auto mb-4">
                            {user.image ? (
                                <Image
                                    src={user.image}
                                    alt={user.name || "User"}
                                    fill
                                    className="rounded-full border-2 border-neon-purple shadow-neon-purple"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-surface-base flex items-center justify-center border-2 border-surface-border">
                                    <User size={40} className="text-text-muted" />
                                </div>
                            )}
                        </div>
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <div className="flex items-center justify-center gap-1.5 mt-1 text-xs font-bold uppercase tracking-wider">
                            {isAdmin ? (
                                <span className="text-neon-purple flex items-center gap-1">
                                    <ShieldCheck size={14} /> Admin
                                </span>
                            ) : (
                                <span className="text-text-muted">User</span>
                            )}
                        </div>
                    </div>

                    {isAdmin && (
                        <Link
                            href="/admin/news"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-brand text-white rounded-xl font-black shadow-neon-purple hover-glow-purple transition-all uppercase text-sm"
                        >
                            <ShieldCheck size={18} /> Admin Dashboard
                        </Link>
                    )}
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* User Info */}
                    <section className="glass rounded-2xl p-8">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            Profile Details
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-text-secondary">
                                <Mail size={18} className="text-neon-cyan" />
                                <div>
                                    <p className="text-xs font-bold uppercase text-text-muted">Email Address</p>
                                    <p className="text-text-primary">{user.email || "No email linked"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-text-secondary">
                                <Calendar size={18} className="text-neon-pink" />
                                <div>
                                    <p className="text-xs font-bold uppercase text-text-muted">Member Since</p>
                                    <p className="text-text-primary">
                                        {new Date().toLocaleDateString('en-CY', { month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Order History */}
                    <section className="glass rounded-2xl p-8">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Package size={20} className="text-neon-green" /> E-Shop Purchases
                        </h3>

                        {orders.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-surface-border rounded-xl">
                                <Package size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                                <p className="text-text-secondary">You haven't made any purchases yet.</p>
                                <Link
                                    href="/shop"
                                    className="inline-block mt-4 text-neon-cyan font-bold hover:underline"
                                >
                                    Browse the E-Shop
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order: any) => (
                                    <div key={order.id} className="bg-surface-base border border-surface-border rounded-xl p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-xs font-bold uppercase text-text-muted">Order ID: {order.id.slice(-8)}</p>
                                                <p className="text-sm text-text-primary">{new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="border-t border-surface-border/50 pt-3">
                                            {order.items.map((item: any) => (
                                                <div key={item.id} className="flex justify-between text-sm py-1">
                                                    <span className="text-text-secondary">{item.quantity}x {item.title}</span>
                                                    <span className="font-bold">€{item.price.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className="border-t border-surface-border/50 mt-3 pt-3 flex justify-between font-black">
                                                <span>Total</span>
                                                <span className="text-neon-green">€{order.totalAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
