/**
 * 사이트 URL SSOT — canonical·Open Graph·sitemap·robots·OAuth 리다이렉트가 모두 이 값을 쓴다.
 *
 * 이전에는 5개 파일이 각자 `process.env.NEXT_PUBLIC_SITE_URL ?? "..."`를 선언했고,
 * 기본값도 designfobee.com과 localhost로 서로 달랐다. 배포 도메인이 바뀌면 일부만 고쳐져
 * 잘못된 canonical이 나갈 수 있어 한 곳으로 모았다(CLAUDE.md §14-A ⑥ 중복 데이터 금지).
 *
 * 운영 환경에서는 Vercel 환경변수 NEXT_PUBLIC_SITE_URL을 반드시 설정한다.
 * (미설정 시 아래 기본값이 쓰이므로 도메인이 바뀌면 이 상수도 함께 갱신할 것)
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gbrickcoffee.com";
