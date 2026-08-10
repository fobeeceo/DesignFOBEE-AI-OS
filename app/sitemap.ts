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
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    ...storyUrls,
  ];
}
