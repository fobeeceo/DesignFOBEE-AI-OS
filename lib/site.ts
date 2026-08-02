/**
 * 사이트 URL SSOT — canonical·Open Graph·sitemap·robots·OAuth 리다이렉트가 모두 이 값을 쓴다.
 *
 * 이전에는 5개 파일이 각자 `process.env.NEXT_PUBLIC_SITE_URL ?? "..."`를 선언했고,
 * 기본값도 designfobee.com과 localhost로 서로 달랐다. 배포 도메인이 바뀌면 일부만 고쳐져
 * 잘못된 canonical이 나갈 수 있어 한 곳으로 모았다(CLAUDE.md §14-A ⑥ 중복 데이터 금지).
 *
 * 운영 도메인: fobee.co.kr (대표 승인 2026-07-31)
 * 브랜드 분석 결과 이 사이트는 DesignFOBEE 기업 홈페이지로 확정되었다.
 * GBRICK Coffee 전용 사이트는 gbrickcoffee.com으로 별도 구축 예정(Backlog).
 *
 * ⚠️ www를 정본으로 쓴다(2026-08-02). Vercel이 www.fobee.co.kr을 대표 도메인으로 잡고
 *    있어 apex(fobee.co.kr)로 들어오면 308로 www에 넘긴다. 그런데 canonical·sitemap은
 *    apex를 가리키고 있어, 검색엔진에 "정본은 apex인데 실제로는 www로 넘어가는" 신호가
 *    나가고 있었다. 실제 서빙 호스트에 맞춘다.
 *    Vercel 대표 도메인을 apex로 바꾸면 이 값도 apex로 되돌릴 것.
 *
 * 운영 환경에서는 Vercel 환경변수 NEXT_PUBLIC_SITE_URL을 반드시 설정한다.
 * (미설정 시 아래 기본값이 쓰이므로 도메인이 바뀌면 이 상수도 함께 갱신할 것)
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fobee.co.kr";
