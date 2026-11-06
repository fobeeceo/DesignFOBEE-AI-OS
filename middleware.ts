import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isBrandHost, brandRoute } from "@/lib/franchise/brandDomain";

/**
 * 모든 요청에서 Supabase 세션 쿠키를 갱신한다 (Supabase SSR 표준 패턴).
 * 브랜드 도메인(gbrickcoffee.com)은 먼저 처리한 후 가맹 페이지로 연결한다.
 * 보호 라우트(사진업로드 등)가 추가되면 Supabase 섹션에서 확장한다.
 */
export async function middleware(request: NextRequest) {
  // ── 브랜드 도메인 라우팅 (2026-10-15 대표 지시) ────────────────────────
  // gbrickcoffee.com 계열 도메인: / → /franchise 리라이트, 나머지 경로는 redirect 또는 pass
  const host = request.headers.get("host");
  if (isBrandHost(host)) {
    const { pathname, search } = request.nextUrl;
    const route = brandRoute(pathname, search);
    if (route.kind === "rewrite") {
      const url = request.nextUrl.clone();
      url.pathname = route.pathname;
      return NextResponse.rewrite(url);
    }
    if (route.kind === "redirect") {
      return NextResponse.redirect(route.url, { status: 307 });
    }
    // "pass": 가맹 관련 경로는 Supabase 세션 처리로 fall-through
  }


  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경변수 미설정 시(예: env 입력 전 초기 배포) 인증을 건너뛰어
  // 공개 페이지(홈·/design 등)가 정상적으로 렌더되도록 한다.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // ── GBRICK 인증 게이트 ───────────────────────────────────────────
  // /gbrick-hq : HQ 관리자 (HQ_ADMIN 이상 필요 — 미구현 시 로그인만 확인)
  // /store     : 매장 대시보드 (STORE_STAFF 이상)
  // /gbrick    : 고객 앱 (로그인 없이 메뉴/매장 조회 가능, 주문 시 필요)

  if (pathname.startsWith("/gbrick-hq") && !pathname.startsWith("/gbrick-hq/login")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/gbrick-hq/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/store/") && !pathname.startsWith("/store/login")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/store/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // 고객 앱: 주문·마이페이지·히스토리는 로그인 필요
  const gbrickAuthRequired = ["/gbrick/cart", "/gbrick/history", "/gbrick/mypage"];
  if (gbrickAuthRequired.some((p) => pathname.startsWith(p)) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/gbrick/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ── 기존 DesignFOBEE HQ 게이트 ──────────────────────────────────
  const isProtected = pathname.startsWith("/hq");
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
