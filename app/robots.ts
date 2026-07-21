import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://designfobee.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/hq", "/admin", "/api/"], // 내부 운영·API 크롤링 차단
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
