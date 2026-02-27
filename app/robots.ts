import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gamersunited.cy";

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/settings/",
                    "/api/",
                    "/shop/success",
                    "/shop/cart",
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
