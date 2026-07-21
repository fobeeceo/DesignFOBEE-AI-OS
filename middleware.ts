import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 모든 요청에서 Supabase 세션 쿠키를 갱신한다 (Supabase SSR 표준 패턴).
 * STEP 3 이후 보호 라우트(사진업로드 등)가 추가되면 여기서 리다이렉트 로직을 확장한다.
 */
export async function middleware(request: NextRequest) {
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

  // 인증 게이트: /hq(AI Headquarters)는 로그인 후에만 접근 (헌장 §13 보안).
  // env 미설정 시에는 위에서 이미 스킵되므로 빌드/데모 렌더는 안전.
  if (!user && request.nextUrl.pathname.startsWith("/hq")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
