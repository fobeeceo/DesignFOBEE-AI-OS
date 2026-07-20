import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deriveProvider } from "@/lib/auth/deriveProvider";
import { upsertProfile } from "@/services/profileService";

/**
 * Google/Kakao 소셜 로그인 콜백 (Supabase 표준 OAuth 코드 교환).
 * signInWithOAuth()의 redirectTo가 이 라우트를 가리킨다.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // 소셜 로그인 직후 프로필을 즉시 보장한다 (멱등 upsert).
    // 이전엔 이후 흐름의 ensureProfile 안전망에 의존해 로그인 직후 profile 부재 구간이 있었다.
    const user = data?.user;
    if (user) {
      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      const name = meta.name ?? meta.full_name ?? user.email?.split("@")[0] ?? "사용자";
      await upsertProfile({
        id: user.id,
        name,
        provider: deriveProvider(user.app_metadata?.provider),
      });
    }
  }

  return NextResponse.redirect(new URL("/", req.url));
}
