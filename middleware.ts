import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // Rate Limiting - use x-forwarded-for header for IP tracking
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    // In production, implement proper rate limiting via Upstash Redis or Cloudflare KV

    // Admin route protection: check for session cookie existence
    // Full auth validation happens server-side in the admin pages themselves
    if (url.pathname.startsWith("/admin")) {
        const sessionCookie =
            req.cookies.get("authjs.session-token") ||
            req.cookies.get("__Secure-authjs.session-token");

        if (!sessionCookie) {
            return NextResponse.redirect(
                new URL("/api/auth/signin?callbackUrl=" + encodeURIComponent(url.pathname), req.url)
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
