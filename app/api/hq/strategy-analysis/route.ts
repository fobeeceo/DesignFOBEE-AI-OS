import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/auth/requireAdmin";
import { generateStrategyAnalysis, CeoStrategyAgentError } from "@/agents/ceoStrategyAgent";

/**
 * POST /api/hq/strategy-analysis
 * body: { decision: string, context: string }
 * AI CEO(전략) — Gemini 호출 = 비용 발생 → 인증 필수. 제안까지만(실행 없음, AI-STAFF-POLICY §4).
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const decision = typeof body?.decision === "string" ? body.decision : "";
    const context = typeof body?.context === "string" ? body.context : "";
    if (!decision) {
      return NextResponse.json({ ok: false, error: "decision이 필요합니다." }, { status: 400 });
    }

    const result = await generateStrategyAnalysis({ decision, context });
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      const status = error.code === "NOT_LOGGED_IN" ? 401 : 403;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }
    if (error instanceof CeoStrategyAgentError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 422 });
    }
    console.error("[POST /api/hq/strategy-analysis]", error);
    return NextResponse.json({ ok: false, error: "전략 분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
