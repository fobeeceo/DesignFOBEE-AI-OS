import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * 서버 전용 관리자(Service Role) 클라이언트.
 * 절대 클라이언트 번들에 포함되면 안 된다 — "use client" 파일에서 import 금지.
 * 용도: Naver 커스텀 로그인 시 사용자 생성/세션 발급, 관리자 페이지(STEP 10) 등.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. .env.local을 확인하세요."
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
