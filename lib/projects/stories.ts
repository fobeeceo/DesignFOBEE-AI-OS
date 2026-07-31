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

/** 진행 상태 — ERP·CRM에서 그대로 재사용한다. */
export type ProjectStatus = "planning" | "in_progress" | "completed";

/** 고객 유형 — AI 상담 분류(leadIntelligence 태그)·성공사례DB와 같은 축을 쓴다. */
export type ClientType = "church" | "cafe" | "retail" | "office" | "commercial";

/**
 * 고객 유형 → 화면 표기. 한글 분류명을 각 스토리에 중복 저장하지 않기 위해
 * 여기서 한 번만 정의하고 전부 파생시킨다(중복 데이터 금지).
 * 값은 포트폴리오 갤러리 카테고리 앞부분과 일치시켜 자동 연결에 쓴다.
 */
export const CLIENT_TYPE_LABEL: Record<ClientType, string> = {
  church: "교회",
  cafe: "카페",
  retail: "리테일",
  office: "오피스",
  commercial: "상업공간",
};

export type ProjectStory = {
  /** 사내 관리번호. ERP·성공사례DB와 대조하는 키. 예) "GBRICK-PJT-001" */
  projectId: string;
  /** URL이 되는 값. 영문 소문자·숫자·하이픈만. 예) "gbrick-eunpyeong" → /projects/gbrick-eunpyeong */
  slug: string;
  /** 목록·상세 제목. 예) "GBRICK Coffee 은평본점" */
  title: string;
  /** 고객 유형. 화면 분류명은 CLIENT_TYPE_LABEL에서 자동 파생된다. */
  clientType: ClientType;
  /** 진행 상태. completed가 아니면 사이트에 노출하지 않는다. */
  status: ProjectStatus;
  /** 제공한 서비스. 예) ["설계", "시공", "브랜딩"] */
  services: string[];
  /** 위치. 예) "서울 은평구" */
  location: string;
  /** 완공 연도(표시용). 예) "2013" */
  year: string;
  /** 완공일(정렬·집계용). 예) "2013-05-01". 없으면 year로 정렬한다. */
  completedAt?: string;

  /** 홈 요약 카드에 노출되는 한 줄. 80자 이내 권장. */
  summary: string;
  /** 대표 이미지 slug(확장자 제외). public/images/portfolio/website/ 기준. */
  coverSlug: string;

  /** 상세 페이지 본문 — 대표님이 실제로 겪은 내용만 기록한다. 추측 금지. */
  challenge: string;
  approach: string;
  result: string;

  /** 홈 요약 카드 우선 노출 여부. */
  featured: boolean;
  /**
   * 외부 공개 가능 여부. 고객 공개 동의를 받은 경우에만 true.
   * false면 홈·상세·sitemap 어디에도 노출되지 않는다(SOP-009 공개 동의 원칙).
   */
  public: boolean;

  /** 시공 사진 slug 목록(대표 이미지 제외). 없으면 빈 배열. */
  gallerySlugs?: string[];
  /** 착공 전 / 완공 후 비교 (SOP-009 촬영분이 쌓이면 채운다). 없으면 생략. */
  beforeAfter?: { beforeSlug: string; afterSlug: string; caption: string }[];
  /** 함께 보여줄 다른 프로젝트 slug 목록. */
  relatedProjects?: string[];
  /** 검색 노출을 위한 보조 키워드. 비워도 동작한다. */
  keywords?: string[];
};

/**
 * 실제 스토리가 입력되는 곳. 지금은 비어 있는 것이 정상이다.
 * 대표님이 자료를 주시면 이 배열에만 추가하면 홈·포트폴리오·상세·SEO가 전부 따라온다.
 */
export const PROJECT_STORIES: ProjectStory[] = [];

/** 화면 분류명(한글)을 고객 유형에서 파생한다. */
export function getCategoryLabel(story: ProjectStory): string {
  return CLIENT_TYPE_LABEL[story.clientType];
}

/**
 * 사이트에 노출 가능한 스토리만 추린다.
 * 공개 동의(public)와 완공(completed)을 모두 만족해야 한다.
 */
function visibleStories(): ProjectStory[] {
  return PROJECT_STORIES.filter((story) => story.public && story.status === "completed");
}

/** 정렬 기준값 — completedAt이 있으면 그것을, 없으면 연도를 쓴다. */
function sortKey(story: ProjectStory): string {
  return story.completedAt ?? `${story.year}-01-01`;
}

/** 스토리가 하나라도 있는지 — 홈 섹션 노출 여부를 이 값으로 판단한다. */
export function hasStories(): boolean {
  return visibleStories().length > 0;
}

/** 홈 요약 카드용 — featured 우선, 그 다음 최신순. */
export function getFeaturedStories(limit = 3): ProjectStory[] {
  return visibleStories()
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return sortKey(b).localeCompare(sortKey(a));
    })
    .slice(0, limit);
}

export function getStoryBySlug(slug: string): ProjectStory | undefined {
  return visibleStories().find((story) => story.slug === slug);
}

/** 상세 페이지 정적 생성용 slug 목록. */
export function getAllStorySlugs(): string[] {
  return visibleStories().map((story) => story.slug);
}

/**
 * 포트폴리오 사진 → 스토리 자동 연결.
 * 사진의 카테고리 앞부분("카페 · 라운지" → "카페")이 스토리 분류명과 같으면 연결된 것으로 본다.
 * 별도 매핑 테이블을 두지 않아 데이터가 두 곳에 존재하지 않는다.
 */
export function getStoryForCategory(category: string): ProjectStory | undefined {
  const field = category.split(" · ")[0];
  return visibleStories().find((story) => getCategoryLabel(story) === field);
}

/** 스토리에 연결된 실제 시공 사진(갤러리에 존재하는 것만). */
export function getGalleryForStory(story: ProjectStory) {
  const slugs = new Set([story.coverSlug, ...(story.gallerySlugs ?? [])]);
  return WORK_GALLERY.filter((item) => slugs.has(item.slug));
}

/** 연관 프로젝트 — 공개 가능한 것만 반환한다. */
export function getRelatedStories(story: ProjectStory): ProjectStory[] {
  const slugs = story.relatedProjects ?? [];
  return slugs
    .map((slug) => getStoryBySlug(slug))
    .filter((item): item is ProjectStory => Boolean(item));
}
