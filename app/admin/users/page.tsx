export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Shield, ShieldAlert, User as UserIcon } from "lucide-react";
import RoleToggle from "@/components/RoleToggle";

export default async function AdminUsersPage() {
    const session = await auth();

    const users = await prisma.user.findMany({
        orderBy: { name: "asc" },
    });

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-text-primary">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gradient-brand">
                        USER MANAGEMENT
                    </h1>
                    <p className="text-text-secondary mt-1">Manage user roles and permissions</p>
                </div>
            </div>

            <div className="glass rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-base border-b border-surface-border text-sm uppercase text-text-muted font-bold">
                            <th className="p-4">User</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-surface-border/50 hover:bg-surface-overlay/30 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {user.image ? (
                                            <img src={user.image} alt="" className="w-8 h-8 rounded-full border border-surface-border" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-surface-base flex items-center justify-center border border-surface-border">
                                                <UserIcon size={16} className="text-text-muted" />
                                            </div>
                                        )}
                                        <span className="font-semibold">{user.name || "Anonymous"}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {user.email || "N/A"}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {user.role === "ADMIN" ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                                                <ShieldAlert size={12} /> ADMIN
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-surface-base text-text-muted border border-surface-border">
                                                <Shield size={12} /> USER
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <RoleToggle
                                        userId={user.id}
                                        currentRole={user.role}
                                        isSelf={session?.user?.id === user.id}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
