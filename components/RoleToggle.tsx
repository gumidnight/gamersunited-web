"use client";

import { useTransition } from "react";
import { toggleUserRole } from "@/lib/user-actions";
import { ShieldCheck, ShieldX } from "lucide-react";

interface RoleToggleProps {
    userId: string;
    currentRole: string;
    isSelf: boolean;
}

export default function RoleToggle({ userId, currentRole, isSelf }: RoleToggleProps) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        if (isSelf) return;

        const confirmMsg = currentRole === "ADMIN"
            ? "Are you sure you want to remove admin permissions from this user?"
            : "Are you sure you want to make this user an ADMIN?";

        if (confirm(confirmMsg)) {
            startTransition(async () => {
                try {
                    await toggleUserRole(userId, currentRole);
                } catch (error: any) {
                    alert(error.message);
                }
            });
        }
    };

    if (isSelf) {
        return (
            <span className="text-xs text-text-muted italic px-3">
                Cannot change own role
            </span>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ml-auto ${currentRole === "ADMIN"
                    ? "bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20 border border-neon-pink/20"
                    : "bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 border border-neon-cyan/20"
                } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            {isPending ? (
                "Processing..."
            ) : currentRole === "ADMIN" ? (
                <>
                    <ShieldX size={14} /> Demote to User
                </>
            ) : (
                <>
                    <ShieldCheck size={14} /> Promote to Admin
                </>
            )}
        </button>
    );
}
