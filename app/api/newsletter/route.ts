import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }

        // Store email in database
        // @ts-ignore
        await prisma.newsletter.upsert({
            where: { email },
            update: { createdAt: new Date() }, // Refresh timestamp if they re-subscribe
            create: { email }
        });

        return NextResponse.json({ success: true, message: "Subscribed successfully" });
    } catch (err) {
        console.error("Newsletter error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
