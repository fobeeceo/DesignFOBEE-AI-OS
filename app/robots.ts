import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";


export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 내부 운영·API·로그인 필요 앱 플로우는 색인 대상이 아님(마케팅 콘텐츠 페이지만 색인).
      disallow: ["/hq", "/admin", "/api/", "/login", "/signup", "/upload", "/analyze", "/consult", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
