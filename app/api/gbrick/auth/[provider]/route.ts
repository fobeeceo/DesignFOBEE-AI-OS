export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isMemberProvider, safeNext } from "@/lib/gbrick/member";
import { buildAuthUrl, oauthConfig, redirectUriFor } from "@/lib/gbrick/oauth";

const OAUTH_STATE_COOKIE = "gbrick_oauth_state";
const OAUTH_NEXT_COOKIE = "gbrick_oauth_next";

/**
 * GET /api/gbrick/auth/kakao | naver
 * 로그인 시작 — 위조 방지용 state 를 쿠키에 두고 카카오·네이버 로그인 화면으로 보낸다.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isMemberProvider(provider)) return NextResponse.json({ error: "지원하지 않는 로그인 방식" }, { status: 404 });

  const cfg = oauthConfig(provider);
  if (!cfg) return NextResponse.redirect(new URL("/gbrick/login?error=not_ready", req.url));

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildAuthUrl(provider, state, redirectUriFor(provider), cfg.clientId));
  const cookie = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 600 };
  res.cookies.set(OAUTH_STATE_COOKIE, state, cookie);
  res.cookies.set(OAUTH_NEXT_COOKIE, safeNext(req.nextUrl.searchParams.get("next")), cookie);
  return res;
}
