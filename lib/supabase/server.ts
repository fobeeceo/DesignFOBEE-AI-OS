import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트 / API 라우트 / Server Action에서 사용하는 Supabase 클라이언트.
 * 쿠키 기반 세션을 읽고 쓴다. (Naver 커스텀 로그인 콜백에서도 이 클라이언트로 세션을 발급한다)
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Component에서 호출된 경우 무시 (middleware가 세션을 갱신한다)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Server Component에서 호출된 경우 무시
          }
        },
      },
    }
  );
}
