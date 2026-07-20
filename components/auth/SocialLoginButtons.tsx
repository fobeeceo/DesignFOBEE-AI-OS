"use client";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Apple / Google / Kakao / Naver 소셜 로그인 버튼.
 * Apple, Google, Kakao는 Supabase 내장 OAuth 사용(공용 /auth/callback).
 * Naver는 Supabase 미지원이라 자체 라우트(/api/auth/naver)로 우회한다.
 *
 * ⚠️ Apple: Supabase 대시보드 → Authentication → Providers에서 Apple을 활성화해야 동작한다.
 *    또한 provider 정식 기록(AuthProvider enum에 APPLE 추가)은 Core DB(Phase 3) 안건이며,
 *    그 전까지는 deriveProvider 폴백(EMAIL)으로 잠정 기록된다.
 */
export function SocialLoginButtons() {
  const supabase = createClient();

  async function loginWith(provider: "apple" | "google" | "kakao") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${SITE_URL}/auth/callback` },
    });
  }

  function loginWithNaver() {
    window.location.href = "/api/auth/naver";
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => loginWith("apple")}
        className={cn(
          "flex h-11 items-center justify-center gap-2 rounded-md bg-black text-sm font-medium text-white transition-opacity hover:opacity-90"
        )}
      >
        Apple로 계속하기
      </button>

      <button
        type="button"
        onClick={() => loginWith("google")}
        className={cn(
          "flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium transition-colors hover:bg-muted"
        )}
      >
        Google로 계속하기
      </button>

      <button
        type="button"
        onClick={() => loginWith("kakao")}
        className={cn(
          "flex h-11 items-center justify-center gap-2 rounded-md bg-[#FEE500] text-sm font-medium text-[#191919] transition-opacity hover:opacity-90"
        )}
      >
        카카오로 계속하기
      </button>

      <button
        type="button"
        onClick={loginWithNaver}
        className={cn(
          "flex h-11 items-center justify-center gap-2 rounded-md bg-[#03C75A] text-sm font-medium text-white transition-opacity hover:opacity-90"
        )}
      >
        네이버로 계속하기
      </button>
    </div>
  );
}
