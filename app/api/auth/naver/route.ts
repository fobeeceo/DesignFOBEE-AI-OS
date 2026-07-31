import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getNaverAuthUrl } from "@/lib/auth/naver";
import { SITE_URL } from "@/lib/site";


/**
 * GET /api/auth/naver
 * 네이버 로그인 시작점. state를 쿠키에 저장(CSRF 방지)하고 네이버 인증 페이지로 이동한다.
 */
export async function GET() {
  const state = randomBytes(16).toString("hex");
  const redirectUri = `${SITE_URL}/api/auth/naver/callback`;

  const response = NextResponse.redirect(getNaverAuthUrl(state, redirectUri));

  response.cookies.set("naver_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
