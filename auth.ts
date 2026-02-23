/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async jwt({ token, user, profile }: any) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }

            // Auto-promote gumidnight to ADMIN
            const name = token?.name || user?.name || (profile as any)?.username;
            if (name === "gumidnight") {
                token.role = "ADMIN";
            }

            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.id || token.sub;
                (session.user as any).role = token.role || "USER";
            }
            return session;
        },
    },
    session: {
        strategy: "jwt"
    }
});
