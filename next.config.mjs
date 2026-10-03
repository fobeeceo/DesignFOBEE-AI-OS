import { syncVoiceOrder } from "./scripts/sync-voice-order.mjs";

// 「대화로 주문」 체험판(voice-order/)을 public/gbrick-order/로 복사한다 — 빌드·개발 서버 시작 때마다.
// 실패해도 홈페이지 빌드는 막지 않는다(체험판 주소만 404).
try {
  syncVoiceOrder({ quiet: true });
} catch (e) {
  console.warn(`[대화로 주문] 동기화 실패 — /gbrick-order 를 건너뜁니다: ${e.message}`);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 빌드에서만 standalone 출력 사용(Dockerfile이 DOCKER_BUILD=true 설정).
  // Vercel 빌드는 이 값이 없어 기존 방식 그대로 — Vercel 파이프라인 영향 없음.
  output: process.env.DOCKER_BUILD === "true" ? "standalone" : undefined,
  // fobee.co.kr/gbrick-order → 체험판 첫 화면 (정적 파일 public/gbrick-order/index.html)
  async rewrites() {
    return [{ source: "/gbrick-order", destination: "/gbrick-order/index.html" }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
