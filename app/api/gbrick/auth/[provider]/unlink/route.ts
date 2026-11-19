export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { memberIdFor } from "@/lib/gbrick/member";
import { isKakaoWebhookAuthorized } from "@/lib/gbrick/oauth";
import { anonymizeMember } from "@/lib/gbrick/repositories/supabase";

/**
 * 카카오 "연결 끊기 웹훅" — 고객이 카카오에서 앱 연결을 끊거나 카카오 계정을 삭제하면 카카오가 알려 준다.
 * 알림을 받으면 그 회원의 닉네임을 지우고 계정을 비활성화한다 (마이페이지 '회원탈퇴'와 같은 처리, 주문 기록은 보존).
 * 이미 연결이 끊긴 뒤의 알림이라 진행 중인 주문이 있어도 거절하지 않는다.
 * 같은 알림이 여러 번 와도 결과는 같다.
 */
async function handle(req: NextRequest, provider: string, userIdFromQuery: string | null) {
  if (provider !== "kakao") return NextResponse.json({ error: "지원하지 않는 요청" }, { status: 404 });
  if (!process.env.GBRICK_KAKAO_ADMIN_KEY) {
    console.error("[kakao unlink] GBRICK_KAKAO_ADMIN_KEY 미설정 — 연결 해제 알림을 처리할 수 없음");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  if (!isKakaoWebhookAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let userId = userIdFromQuery;
  if (!userId && req.method === "POST") {
    const type = req.headers.get("content-type") ?? "";
    try {
      if (type.includes("application/json")) userId = String(((await req.json()) as { user_id?: unknown }).user_id ?? "") || null;
      else userId = new URLSearchParams(await req.text()).get("user_id");
    } catch { userId = null; }
  }
  const memberId = userId ? memberIdFor("kakao", userId) : null;
  if (!memberId) return NextResponse.json({ error: "bad request" }, { status: 400 });

  try {
    await anonymizeMember(memberId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[kakao unlink] 회원 비활성화 실패:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "server error" }, { status: 500 }); // 카카오가 다시 시도하게 한다
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  return handle(req, (await params).provider, req.nextUrl.searchParams.get("user_id"));
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  return handle(req, (await params).provider, req.nextUrl.searchParams.get("user_id"));
}
