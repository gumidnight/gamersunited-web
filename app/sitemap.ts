import { prisma } from "@/lib/prisma";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gamersunited.cy";

    // Static Pages
    const staticPages = [
        "",
        "/shop",
        "/news",
        "/about",
        "/community",
        "/contact",
        "/faq",
        "/privacy",
        "/terms",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.7,
    }));

    try {
        // Dynamic Shop Products
        const products = await prisma.product.findMany({
            where: { isActive: true },
            select: { id: true, lastSyncedAt: true }
        });

        const productUrls = products.map((p) => ({
            url: `${baseUrl}/shop/${p.id}`,
            lastModified: p.lastSyncedAt || new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));

        // Dynamic News Articles
        const articles = await prisma.newsPost.findMany({
            where: { published: true },
            select: { slug: true, updatedAt: true }
        });

        const articleUrls = articles.map((a: any) => ({
            url: `${baseUrl}/news/${a.slug}`,
            lastModified: a.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.6,
        }));

        return [...staticPages, ...productUrls, ...articleUrls];
    } catch (error) {
        console.error("Sitemap generation failed:", error);
        // Fallback to static pages only to not break the build
        return staticPages;
    }
}
