import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Required for OpenNext + Prisma
  serverExternalPackages: ["@prisma/client", ".prisma/client", "@vercel/og", "pg", "@prisma/adapter-pg", "pg-cloudflare"],
};

export default nextConfig;

// Initialize OpenNext for local development
initOpenNextCloudflareForDev();
