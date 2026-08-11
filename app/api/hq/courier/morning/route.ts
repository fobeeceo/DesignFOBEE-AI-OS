import { NextRequest, NextResponse } from "next/server";
import { AdminAuthError } from "@/lib/auth/requireAdmin";
import { requireServiceOrAdmin } from "@/lib/auth/requireServiceOrAdmin";
import { runMorning, CourierAgentError, type MorningInput } from "@/agents/courierAgent";

/**
 * 전령 아침 브리핑.
 *
 * GET  /api/hq/courier/morning            → ERP 신호만으로 브리핑(외부 입력 없음)
 * GET  /api/hq/courier/morning?format=md  → 마크다운 원문(text/plain)
 * POST /api/hq/courier/morning            → body: MorningInput. 외부 소식·문의·업무까지 포함해 브리핑
 *
 * GET을 둔 이유: 매일 아침 자동 호출하는 쪽(n8n 예약 실행, 또는 Hermes Agent 같은 외부 상주
 * 에이전트)이 본문 없이 URL 하나로 부를 수 있어야 하기 때문이다. 이 라우트는 아무것도 바꾸지
 * 않고 아무것도 보내지 않으므로 GET이 맞다.
 *
 * `format=md`는 외부 에이전트가 받은 값을 그대로 메신저에 붙여넣을 수 있게 하기 위한 것이다.
 * JSON을 파싱해 다시 조립하게 만들면 그 과정에서 문구가 바뀔 여지가 생긴다.
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireServiceOrAdmin(req);

    const date = req.nextUrl.searchParams.get("date") ?? undefined;
    const result = runMorning({ date });

    const format = req.nextUrl.searchParams.get("format");
    if (format === "md" || format === "markdown") {
      return new NextResponse(result.brief.markdown, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return handleError(error, "GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireServiceOrAdmin(req);

    const body = (await req.json().catch(() => ({}))) as MorningInput;
    return NextResponse.json({ ok: true, data: runMorning(body ?? {}) });
  } catch (error) {
    return handleError(error, "POST");
  }
}

function handleError(error: unknown, method: string) {
  if (error instanceof AdminAuthError) {
    const status = error.code === "NOT_LOGGED_IN" ? 401 : 403;
    return NextResponse.json({ ok: false, error: error.message }, { status });
  }
  if (error instanceof CourierAgentError) {
    return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 422 });
  }
  console.error(`[${method} /api/hq/courier/morning]`, error);
  return NextResponse.json({ ok: false, error: "아침 브리핑 생성 중 오류가 발생했습니다." }, { status: 500 });
}
