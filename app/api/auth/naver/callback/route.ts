import { NextRequest, NextResponse } from "next/server";
import { exchangeNaverCode, fetchNaverProfile } from "@/lib/auth/naver";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { upsertProfile } from "@/services/profileService";
import { SITE_URL } from "@/lib/site";


/**
 * GET /api/auth/naver/callback
 * 1) state 검증  2) 코드→토큰 교환  3) 프로필 조회
 * 4) Supabase 사용자 생성/조회 (Admin API)  5) 매직링크 토큰으로 세션 발급
 *
 * Supabase Admin API로 임의 프로바이더 사용자에게 세션을 발급하는 방식은
 * Supabase 커뮤니티에서 안내하는 비공식 프로바이더 우회 패턴이다.
 * 운영 반영 전 실제 프로젝트에서 반드시 동작 검증이 필요하다.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("naver_oauth_state")?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/login?error=naver_state_mismatch", req.url));
  }

  try {
    const redirectUri = `${SITE_URL}/api/auth/naver/callback`;
    const accessToken = await exchangeNaverCode(code, state, redirectUri);
    const profile = await fetchNaverProfile(accessToken);

    if (!profile.email) {
      return NextResponse.redirect(new URL("/login?error=naver_no_email", req.url));
    }

    const admin = createAdminClient();

    // 사용자 생성 시도 → 이미 있으면 목록에서 조회
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: profile.email,
      email_confirm: true,
      user_metadata: { name: profile.name ?? profile.nickname, provider: "naver" },
    });

    let userId = created?.user?.id;

    if (createErr) {
      // 이미 가입된 이메일 → 사용자 목록에서 조회한다.
      // listUsers는 페이지네이션되므로(기본 50건) 단일 호출 시 사용자가 많아지면
      // 대상을 못 찾아 재로그인이 실패할 수 있다. perPage를 최대(1000)로 두고
      // 찾을 때까지 페이지를 순회한다.
      for (let page = 1; !userId; page++) {
        const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        userId = list.users.find((u) => u.email === profile.email)?.id;
        if (list.users.length < 1000) break;
      }
    }

    if (!userId) {
      return NextResponse.redirect(new URL("/login?error=naver_user_failed", req.url));
    }

    // 매직링크 토큰 생성 → verifyOtp로 현재 요청에 세션 쿠키 발급
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: profile.email,
    });

    const tokenHash = linkData?.properties?.hashed_token;

    if (linkErr || !tokenHash) {
      return NextResponse.redirect(new URL("/login?error=naver_link_failed", req.url));
    }

    const supabase = createClient();
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });

    if (verifyErr) {
      return NextResponse.redirect(new URL("/login?error=naver_verify_failed", req.url));
    }

    await upsertProfile({
      id: userId,
      name: profile.name ?? profile.nickname ?? "네이버 사용자",
      provider: "NAVER",
    });

    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.delete("naver_oauth_state");
    return response;
  } catch (error) {
    console.error("[GET /api/auth/naver/callback]", error);
    return NextResponse.redirect(new URL("/login?error=naver_unknown", req.url));
  }
}
