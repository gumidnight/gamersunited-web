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
            const username = (profile as any)?.username || token?.name || user?.name;
            if (username && username.toLowerCase() === "gumidnight") {
                token.role = "ADMIN";
            }

            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = (token.id as string) || (token.sub as string);

                let role = token.role || "USER";
                // Extra safety check in session
                const username = session.user.name || (session.user as any).username;
                if (username && username.toLowerCase() === "gumidnight") {
                    role = "ADMIN";
                }

                (session.user as any).role = role;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt"
    }
});
