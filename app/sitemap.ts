import type { MetadataRoute } from "next";
import { getAllStorySlugs } from "@/lib/projects/stories";
import { SITE_URL } from "@/lib/site";


/**
 * 프로젝트 스토리 URL은 lib/projects/stories.ts에서 자동으로 가져온다.
 * 스토리를 추가하면 sitemap에도 자동 반영되므로 여기를 직접 수정할 일이 없다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const storyUrls: MetadataRoute.Sitemap = getAllStorySlugs().map((slug) => ({
    url: `${SITE_URL}/projects/${slug}`,
    lastModified,
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/design`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/consult`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/franchise`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/franchise/diagnosis`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    // /gbrick/info: 방문객 전용 카페 소개 페이지 (AI 검색 소스, FoodEstablishment + FAQPage JSON-LD)
    // /gbrick (매장 조회 앱, use client)는 별도로 색인 제외됨
    { url: `${SITE_URL}/gbrick/info`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/memoir`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/memoir/write`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    ...storyUrls,
  ];
}
