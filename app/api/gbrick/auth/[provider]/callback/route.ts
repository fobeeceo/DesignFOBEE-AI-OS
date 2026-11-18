export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { MEMBER_COOKIE, createMemberSession, isMemberProvider, memberCookieOptions, memberIdFor, safeNext } from "@/lib/gbrick/member";
import { fetchMemberProfile, oauthConfig, redirectUriFor } from "@/lib/gbrick/oauth";
import { upsertMember } from "@/lib/gbrick/repositories/supabase";

const STATE_COOKIE = "gbrick_oauth_state";
const NEXT_COOKIE = "gbrick_oauth_next";

/**
 * GET /api/gbrick/auth/kakao|naver/callback
 * 1) state 확인  2) 코드 → 고유번호·닉네임  3) 회원 만들기/찾기  4) 로그인 쿠키 발급
 * 고객에게는 이유를 짧게만 보이고, 자세한 오류는 서버 로그에만 남긴다.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isMemberProvider(provider)) return NextResponse.json({ error: "지원하지 않는 로그인 방식" }, { status: 404 });

  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/gbrick/login?error=${reason}`, req.url));
    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete(NEXT_COOKIE);
    return res;
  };

  const q = req.nextUrl.searchParams;
  if (q.get("error")) return fail("cancelled"); // 고객이 동의 화면에서 취소
  const code = q.get("code");
  const state = q.get("state");
  const savedState = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !savedState || state !== savedState) return fail("state");

  const cfg = oauthConfig(provider);
  if (!cfg) return fail("not_ready");

  try {
    const profile = await fetchMemberProfile(provider, code, state, redirectUriFor(provider), cfg);
    const memberId = memberIdFor(provider, profile.providerUserId);
    if (!memberId) return fail("profile");
    await upsertMember(memberId, profile.nickname);

    const res = NextResponse.redirect(new URL(safeNext(req.cookies.get(NEXT_COOKIE)?.value), req.url));
    res.cookies.set(MEMBER_COOKIE, await createMemberSession(memberId), memberCookieOptions);
    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete(NEXT_COOKIE);
    return res;
  } catch (err) {
    console.error(`[GET /api/gbrick/auth/${provider}/callback]`, err instanceof Error ? err.message : err);
    return fail("failed");
  }
}
