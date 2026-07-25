import type { NextRequest } from "next/server";
import { requireAdmin, type AdminProfile } from "@/lib/auth/requireAdmin";

const SERVICE_PROFILE: AdminProfile = { id: "service:n8n", name: "n8n 자동화" };

/**
 * /api/hq/* 라우트를 사람(브라우저 세션) 또는 n8n(서비스 토큰) 둘 다로 호출 가능하게 한다.
 * n8n → web 호출은 `Authorization: Bearer <N8N_SERVICE_TOKEN>` 헤더로 인증한다.
 * N8N_SERVICE_TOKEN이 설정 안 돼 있으면 이 경로 자체가 비활성화되고 기존 requireAdmin()만 동작
 * (무파괴 — n8n을 아직 안 쓰는 환경/배포에서는 아무 영향 없음).
 */
export async function requireServiceOrAdmin(req: NextRequest): Promise<AdminProfile> {
  const expected = process.env.N8N_SERVICE_TOKEN;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${expected}`) {
      return SERVICE_PROFILE;
    }
  }
  return requireAdmin();
}
