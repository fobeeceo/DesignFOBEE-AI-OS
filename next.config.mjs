/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 빌드에서만 standalone 출력 사용(Dockerfile이 DOCKER_BUILD=true 설정).
  // Vercel 빌드는 이 값이 없어 기존 방식 그대로 — Vercel 파이프라인 영향 없음.
  output: process.env.DOCKER_BUILD === "true" ? "standalone" : undefined,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
