/**
 * 프로젝트 스토리 SSOT — 홈 요약 · 포트폴리오 · 상세 페이지 · SEO(sitemap 포함)가
 * 모두 이 배열 하나만 참조한다. 같은 데이터를 두 곳에 두지 않는다(CLAUDE.md §14-A ⑥).
 *
 * ⚠️ 현재 비어 있는 것이 정상이다. 실제 프로젝트 스토리 자료를 대표님에게 받기 전까지
 *    항목을 만들어 넣지 않는다(§14-A ②: 실제 자료가 없으면 생성하지 않고 빈 상태를 인정).
 *    배열이 비어 있으면 홈 요약 섹션과 상세 라우트가 자동으로 숨겨지므로,
 *    빈 껍데기 페이지가 노출되지 않는다.
 *
 * 입력 방법은 PROJECT-STORY-GUIDE.md 참조.
 */

import { WORK_GALLERY } from "@/lib/portfolio/workGallery";

export type ProjectStory = {
  /** URL이 되는 값. 영문 소문자·숫자·하이픈만. 예) "gbrick-eunpyeong" → /projects/gbrick-eunpyeong */
  slug: string;
  /** 목록·상세 제목. 예) "GBRICK Coffee 은평본점" */
  title: string;
  /** 분류. 포트폴리오 카테고리와 같은 값을 쓰면 자동으로 연결된다. 예) "카페" */
  category: string;
  /** 위치. 예) "서울 은평구" */
  location: string;
  /** 완공 연도. 예) "2013" */
  year: string;
  /** 홈 요약 카드에 노출되는 한 줄. 80자 이내 권장. */
  summary: string;
  /** 대표 이미지 slug(확장자 제외). public/images/portfolio/website/ 기준. */
  coverSlug: string;

  /** 상세 페이지 본문 — 아래 4개는 대표님이 실제로 겪은 내용만 기록한다. 추측 금지. */
  challenge: string;
  approach: string;
  result: string;

  /** 시공 사진 slug 목록(대표 이미지 제외). 없으면 빈 배열. */
  gallerySlugs?: string[];
  /** 착공 전 / 완공 후 비교 (SOP-009 촬영분이 쌓이면 채운다). 없으면 생략. */
  beforeAfter?: { beforeSlug: string; afterSlug: string; caption: string }[];
  /** 검색 노출을 위한 보조 키워드. 비워도 동작한다. */
  keywords?: string[];
};

/**
 * 실제 스토리가 입력되는 곳. 지금은 비어 있는 것이 정상이다.
 * 대표님이 자료를 주시면 이 배열에만 추가하면 홈·포트폴리오·상세·SEO가 전부 따라온다.
 */
export const PROJECT_STORIES: ProjectStory[] = [];

/** 스토리가 하나라도 있는지 — 홈 섹션 노출 여부를 이 값으로 판단한다. */
export function hasStories(): boolean {
  return PROJECT_STORIES.length > 0;
}

/** 홈 요약 카드용 — 최신순으로 limit개. 비어 있으면 빈 배열. */
export function getFeaturedStories(limit = 3): ProjectStory[] {
  return [...PROJECT_STORIES]
    .sort((a, b) => Number(b.year) - Number(a.year))
    .slice(0, limit);
}

export function getStoryBySlug(slug: string): ProjectStory | undefined {
  return PROJECT_STORIES.find((story) => story.slug === slug);
}

/** 상세 페이지 정적 생성용 slug 목록. */
export function getAllStorySlugs(): string[] {
  return PROJECT_STORIES.map((story) => story.slug);
}

/**
 * 포트폴리오 사진 → 스토리 자동 연결.
 * 사진의 카테고리 앞부분("카페 · 라운지" → "카페")이 스토리 category와 같으면 연결된 것으로 본다.
 * 별도 매핑 테이블을 두지 않아 데이터가 두 곳에 존재하지 않는다.
 */
export function getStoryForCategory(category: string): ProjectStory | undefined {
  const field = category.split(" · ")[0];
  return PROJECT_STORIES.find((story) => story.category === field);
}

/** 스토리에 연결된 실제 시공 사진(갤러리에 존재하는 것만). */
export function getGalleryForStory(story: ProjectStory) {
  const slugs = new Set([story.coverSlug, ...(story.gallerySlugs ?? [])]);
  return WORK_GALLERY.filter((item) => slugs.has(item.slug));
}
