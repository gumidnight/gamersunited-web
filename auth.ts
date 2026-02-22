/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID || "",
            clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
            authorization: "https://discord.com/api/oauth2/authorize?scope=identify+email",
        }),
    ],
    callbacks: {
        async session({ session, user }: any) {
            if (session.user) {
                session.user.id = user.id;
                // Optionally attach discord avatar/username if needed directly, 
                // but NextAuth pulls the image/name by default.
            }
            return session;
        },
    },
    session: {
        strategy: "jwt"
    }
});
