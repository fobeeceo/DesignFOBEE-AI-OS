import { createClient } from "@supabase/supabase-js";

/**
 * 서비스 롤 Supabase 클라이언트 — 비공개 버킷 쓰기·서명 링크 발급 전용.
 *
 * ⚠️ 절대 클라이언트 컴포넌트에서 import 하지 않는다. 이 키는 RLS를 우회한다.
 *    서버 라우트(app/api/**)에서만 쓴다.
 * ⚠️ 키가 없으면 여기서 바로 던진다. 조용히 실패하면 도면이 저장되지 않은 채
 *    접수만 성공한 것처럼 보이기 때문이다.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase 관리자 클라이언트 설정 없음 — NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 확인 필요"
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
