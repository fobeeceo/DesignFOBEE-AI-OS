/**
 * GBRICK Coffee 도메인 → 가맹 랜딩(/franchise) 연결 (2026-10-14 대표 결정).
 *
 * 현재 경로(2026-10-14 확인):
 *   gbrickcoffee.co.kr (외부 Apache 호스팅) → 0초 새로고침 → www.gbrickcoffee.com (이 Vercel 프로젝트)
 * 지금까지는 www.gbrickcoffee.com이 DesignFOBEE 홈을 그대로 보여줬다.
 * 브랜드 주소로 온 사람은 가맹을 보러 온 것이므로 가맹 페이지로 보낸다.
 *
 * - 307(임시)로 보낸다. 나중에 gbrickcoffee.com 전용 사이트를 만들면 바로 되돌릴 수 있게
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
