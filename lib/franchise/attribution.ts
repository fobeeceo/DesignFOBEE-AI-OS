import { isBrandHost } from "@/lib/franchise/brandDomain";

/**
 * 가맹상담 유입 경로 추적 — "어느 채널 영상을 보고 상담을 남겼는가"를 남긴다.
 *
 * 2026-10-14 대표 결정: 광고 전에 틱톡·네이버 블로그·유튜브 쇼츠·인스타그램 릴스 영상으로
 * 먼저 유입시키고, 자료가 쌓이면 광고로 넘어간다. 그 판단 근거가 채널별 상담 건수다.
 *
 * 저장 방식: Lead 테이블에 컬럼을 더 만들지 않고 기존 tags 배열에 "유입:tiktok" 형식으로
 * 붙인다. 마이그레이션 없이 CRM 태그 필터로 바로 셀 수 있다.
 *
 * 채널 링크 규칙(영상 설명란·프로필 링크에 붙일 값)은 CHANNEL_LINKS를 본다.
 */

export interface LeadAttribution {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  /** 직전 페이지의 호스트만 남긴다(경로·검색어는 개인정보가 섞일 수 있어 버린다). */
  referrer?: string;
}

const MAX_LEN = 50;
const STORAGE_KEY = "gbrick_attribution";

/** 소문자·짧은 토큰으로 정리한다. 공격 문자열이나 긴 값이 태그로 들어가지 않게 한다. */
export function sanitizeToken(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣_.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, MAX_LEN);
  return cleaned || undefined;
}

/**
 * utm 꼬리표 없이 들어온 경우, 직전 사이트 주소로 채널을 추정한다.
 * 앱 안 브라우저(틱톡·인스타)는 referrer를 비우는 경우가 많아 utm 링크가 기본이다.
 */
const REFERRER_CHANNELS: [RegExp, string][] = [
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)blog\.naver\.com$/, "naver_blog"],
  [/(^|\.)naver\.com$/, "naver"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)(kakao\.com|daum\.net)$/, "kakao"],
  [/(^|\.)facebook\.com$/, "facebook"],
];

function referrerHost(referrer: string, selfHost: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (!host || host === selfHost.toLowerCase()) return undefined;
    return host;
  } catch {
    return undefined;
  }
}

export function channelFromReferrer(host: string | undefined): string | undefined {
  if (!host) return undefined;
  return REFERRER_CHANNELS.find(([pattern]) => pattern.test(host))?.[1];
}

/** 현재 주소의 utm 값과 referrer로 유입 정보를 만든다. 아무 단서가 없으면 undefined. */
export function parseAttribution(
  search: string,
  referrer: string,
  selfHost: string
): LeadAttribution | undefined {
  const params = new URLSearchParams(search);
  const host = referrerHost(referrer, selfHost);

  const result: LeadAttribution = {
    // 꼬리표·이전 사이트가 없고 브랜드 주소(gbrickcoffee.com)로 들어왔으면 도메인 유입으로 센다.
    // 예전에는 리다이렉트가 utm_source=gbrickcoffee_domain을 붙였는데, 주소를 그대로 두게 바꾸며 여기로 옮겼다.
    source:
      sanitizeToken(params.get("utm_source")) ??
      channelFromReferrer(host) ??
      (isBrandHost(selfHost) ? "gbrickcoffee_domain" : undefined),
    medium: sanitizeToken(params.get("utm_medium")),
    campaign: sanitizeToken(params.get("utm_campaign")),
    content: sanitizeToken(params.get("utm_content")),
    referrer: sanitizeToken(host),
  };

  return cleanAttribution(result);
}

/** 빈 값을 버리고, 남는 게 없으면 undefined. 서버에서도 같은 함수로 다시 정리한다. */
export function cleanAttribution(input: LeadAttribution | undefined): LeadAttribution | undefined {
  if (!input) return undefined;
  const out: LeadAttribution = {};
  for (const key of ["source", "medium", "campaign", "content", "referrer"] as const) {
    const value = sanitizeToken(input[key]);
    if (value) out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** CRM 태그로 변환. 단서가 없으면 "유입:미확인" — 직접 입력인지 앱 브라우저인지 구분할 수 없다. */
export function attributionTags(input: LeadAttribution | undefined): string[] {
  const a = cleanAttribution(input);
  if (!a) return ["유입:미확인"];

  const tags = [`유입:${a.source ?? "미확인"}`];
  if (a.medium) tags.push(`매체:${a.medium}`);
  if (a.campaign) tags.push(`캠페인:${a.campaign}`);
  if (a.content) tags.push(`콘텐츠:${a.content}`);
  return tags;
}

/** 알림 메일 한 줄 요약. */
export function describeAttribution(input: LeadAttribution | undefined): string | undefined {
  const a = cleanAttribution(input);
  if (!a) return undefined;
  return [a.source, a.medium, a.campaign, a.content]
    .filter(Boolean)
    .concat(a.referrer && a.referrer !== a.source ? [`(${a.referrer})`] : [])
    .join(" / ");
}

/**
 * 브라우저에서 유입 정보를 잡아 세션에 보관한다.
 * 영상 링크로 /franchise/diagnosis에 먼저 들어왔다가 상담 폼으로 옮겨도 잃지 않게 하려는 것이다.
 * utm이 붙은 새 방문이면 덮어쓰고, 없으면 앞서 잡은 값을 유지한다.
 */
export function captureAttribution(): LeadAttribution | undefined {
  if (typeof window === "undefined") return undefined;

  const current = parseAttribution(window.location.search, document.referrer, window.location.hostname);
  let stored: LeadAttribution | undefined;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    stored = raw ? cleanAttribution(JSON.parse(raw)) : undefined;
  } catch {
    stored = undefined;
  }

  const hasUtm = new URLSearchParams(window.location.search).has("utm_source");
  const chosen = hasUtm || !stored ? current : stored;

  if (chosen) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chosen));
    } catch {
      // 사생활 보호 모드 등에서 저장이 막혀도 이번 페이지 값은 그대로 쓴다.
    }
  }
  return chosen;
}

/**
 * 채널별 링크 규칙 — 영상 설명란·프로필 링크에 이 주소를 그대로 붙인다.
 * 영상마다 utm_content에 영상 식별자(예: 2610_storefront)를 바꿔 넣으면 영상별로도 센다.
 */
export const CHANNEL_LINKS = [
  { channel: "틱톡", source: "tiktok", medium: "short_video" },
  { channel: "유튜브 쇼츠", source: "youtube", medium: "shorts" },
  { channel: "인스타그램 릴스", source: "instagram", medium: "reels" },
  { channel: "네이버 블로그", source: "naver_blog", medium: "blog" },
] as const;

export function buildChannelLink(
  baseUrl: string,
  source: string,
  medium: string,
  campaign = "franchise_organic",
  content?: string
): string {
  const url = new URL("/franchise", baseUrl);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  if (content) url.searchParams.set("utm_content", content);
  return url.toString();
}
