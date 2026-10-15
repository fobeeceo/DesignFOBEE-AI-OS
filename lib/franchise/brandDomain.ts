/**
 * GBRICK Coffee 도메인 → 가맹 랜딩(/franchise) 연결 (2026-10-14 대표 결정).
 *
 * 현재 경로(2026-10-14 확인):
 *   gbrickcoffee.co.kr (외부 Apache 호스팅) → 0초 새로고침 → www.gbrickcoffee.com (이 Vercel 프로젝트)
 * 지금까지는 www.gbrickcoffee.com이 DesignFOBEE 홈을 그대로 보여줬다.
 * 브랜드 주소로 온 사람은 가맹을 보러 온 것이므로 가맹 페이지를 보여준다.
 *
 * 2026-10-15 대표 지시: 주소창에 gbrickcoffee.com이 그대로 남게 한다.
 * - 첫 화면("/")은 fobee.co.kr로 넘기지 않고 같은 주소에서 /franchise를 보여준다(rewrite).
 * - 가맹 페이지가 쓰는 경로(/franchise·상담 API·개인정보처리방침·정적 파일)는 그대로 둔다.
 * - 그 밖의 DesignFOBEE 페이지(/design, /hq 등)는 www.fobee.co.kr 같은 경로로 보낸다.
 *   브랜드 주소에서 회사 홈페이지가 섞여 보이지 않게 하기 위해서다.
 * - 검색엔진 정본(canonical)은 계속 www.fobee.co.kr/franchise다(app/franchise/page.tsx).
 * - 꼬리표 없이 브랜드 주소로 온 상담은 attribution.ts가 gbrickcoffee_domain으로 센다.
 *
 * - 다른 경로는 307(임시)로 보낸다. 나중에 gbrickcoffee.com 전용 사이트를 만들면 바로 되돌릴 수 있게
 *   브라우저에 영구 기억시키지 않는다.
 * - 꼬리표(utm)는 그대로 넘긴다. 꼬리표가 없으면 utm_source=gbrickcoffee_domain을 붙여
 *   "브랜드 주소를 직접 친 사람"을 따로 센다.
 */

import { SITE_URL } from "@/lib/site";

const BRAND_HOSTS = new Set([
  "gbrickcoffee.com",
  "www.gbrickcoffee.com",
  "gbrickcoffee.co.kr",
  "www.gbrickcoffee.co.kr",
]);

export function isBrandHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return BRAND_HOSTS.has(host.toLowerCase().split(":")[0]);
}

/** 브랜드 도메인 요청을 보낼 주소. 첫 화면은 /franchise, 그 밖의 경로는 같은 경로로 보낸다. */
export function brandRedirectUrl(pathname: string, search: string, siteUrl: string = SITE_URL): string {
  const target = new URL(pathname === "/" ? "/franchise" : pathname, siteUrl);
  const params = new URLSearchParams(search);
  if (!params.has("utm_source")) params.set("utm_source", "gbrickcoffee_domain");
  target.search = params.toString();
  return target.toString();
}

/** 브랜드 주소에서 그대로 보여줄 경로. 가맹 페이지가 화면·제출·동의 확인에 쓰는 것만 둔다. */
const BRAND_PASS_PREFIXES = [
  "/franchise",
  "/api/leads",
  "/api/franchise-diagnosis",
  "/privacy",
  "/_next",
  "/images",
  "/og-image",
  "/icon",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon",
];

export type BrandRoute =
  | { kind: "rewrite"; pathname: string }
  | { kind: "pass" }
  | { kind: "redirect"; url: string };

/** 브랜드 도메인 요청을 어떻게 처리할지 정한다. */
export function brandRoute(pathname: string, search: string, siteUrl: string = SITE_URL): BrandRoute {
  if (pathname === "/") return { kind: "rewrite", pathname: "/franchise" };
  if (BRAND_PASS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}.`))) {
    return { kind: "pass" };
  }
  return { kind: "redirect", url: brandRedirectUrl(pathname, search, siteUrl) };
}
