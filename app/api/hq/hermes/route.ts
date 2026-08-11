import { NextRequest, NextResponse } from "next/server";
import { AdminAuthError } from "@/lib/auth/requireAdmin";
import { requireServiceOrAdmin } from "@/lib/auth/requireServiceOrAdmin";
import { runHermes, HermesAgentError, type HermesInput } from "@/agents/hermesAgent";
import { channelBoard } from "@/lib/hermes/channels";

/**
 * 헤르메스 — AI HQ 전령.
 *
 * GET  /api/hq/hermes  → 채널 연동 현황(무엇으로 보낼 수 있고 무엇이 막혀 있는가)
 * POST /api/hq/hermes  → body: HermesInput. 발송대기함(Outbox)을 만든다.
 *
 * 내부 ERP 신호·리드 문의 원문을 다루므로 관리자 세션 또는 n8n 서비스 토큰이 필요하다.
 * LLM을 호출하지 않아 비용은 발생하지 않지만, 노출되는 데이터가 사내 데이터다.
 *
 * 이 라우트는 아무것도 발송하지 않는다 — 응답의 delivered는 항상 false다(AI-STAFF-POLICY §4).
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireServiceOrAdmin(req);
    return NextResponse.json({ ok: true, data: { channels: channelBoard() } });
  } catch (error) {
    return handleError(error, "GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireServiceOrAdmin(req);

    const body = (await req.json().catch(() => ({}))) as HermesInput;
    const result = runHermes(body ?? {});
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return handleError(error, "POST");
  }
}

function handleError(error: unknown, method: string) {
  if (error instanceof AdminAuthError) {
    const status = error.code === "NOT_LOGGED_IN" ? 401 : 403;
    return NextResponse.json({ ok: false, error: error.message }, { status });
  }
  if (error instanceof HermesAgentError) {
    return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 422 });
  }
  console.error(`[${method} /api/hq/hermes]`, error);
  return NextResponse.json({ ok: false, error: "전달 처리 중 오류가 발생했습니다." }, { status: 500 });
}
