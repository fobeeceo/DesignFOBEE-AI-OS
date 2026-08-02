import { NextRequest, NextResponse } from "next/server";

/**
 * ⚠️ 임시 진단 엔드포인트 — 상담 저장 500 원인 추적용. 확인 즉시 삭제한다.
 *
 * 운영에서만 /api/leads가 500을 내는데 Vercel 로그에 접근할 수 없어,
 * 실제 예외 메시지를 확인하기 위해 한시적으로 둔다.
 *
 * 규칙:
 * - 토큰 없이는 아무것도 응답하지 않는다.
 * - 환경변수 "값"은 절대 반환하지 않는다. 존재 여부와 호스트/포트만 본다.
 * - 오류 메시지에서 자격증명처럼 보이는 부분은 지운다.
 */
export const dynamic = "force-dynamic";

const TOKEN = "df-diag-7Kq2mXpR";

/** 접속 문자열·오류 메시지에서 비밀번호를 지운다. */
function scrub(text: string): string {
  return text.replace(/:\/\/([^:@\s]+):([^@\s]+)@/g, "://$1:****@");
}

function urlShape(raw: string | undefined) {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return { host: u.hostname, port: u.port, db: u.pathname.slice(1), params: u.search };
  } catch {
    return { parseError: true };
  }
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const result: Record<string, unknown> = {
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      DIRECT_URL: Boolean(process.env.DIRECT_URL),
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    },
    databaseUrlShape: urlShape(process.env.DATABASE_URL),
  };

  // 1) Supabase 클라이언트 생성
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { error } = await supabase.auth.getUser();
    result.supabase = { created: true, authError: error ? error.message : null };
  } catch (e) {
    result.supabase = { created: false, error: scrub(String((e as Error)?.message ?? e)) };
  }

  // 2) Prisma 연결 + leads 테이블 확인
  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRawUnsafe<{ n: number }[]>(
      `SELECT count(*)::int AS n FROM leads`
    );
    const cols = await prisma.$queryRawUnsafe<{ n: number }[]>(
      `SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name='leads'`
    );
    result.prisma = { connected: true, leadCount: rows[0]?.n, leadColumns: cols[0]?.n };
  } catch (e) {
    const err = e as { name?: string; code?: string; message?: string };
    result.prisma = {
      connected: false,
      name: err?.name,
      code: err?.code,
      message: scrub(String(err?.message ?? e)).slice(0, 800),
    };
  }

  return NextResponse.json(result);
}
