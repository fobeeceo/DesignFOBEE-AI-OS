import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/auth/requireAdmin";
import { generateMarketingCopy, MarketerAgentError, type MarketingCopyRequest } from "@/agents/marketerAgent";

const VALID_CHANNELS: MarketingCopyRequest["channel"][] = ["instagram", "blog", "franchise_landing"];

/**
 * POST /api/hq/marketing-copy
 * body: { topic: string, channel: "instagram"|"blog"|"franchise_landing" }
 * AI 마케터 — Gemini 호출 = 비용 발생 → 인증 필수(design-trends와 동일 패턴).
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const topic = typeof body?.topic === "string" ? body.topic : "";
    const channel = VALID_CHANNELS.includes(body?.channel) ? body.channel : "instagram";
    if (!topic) {
      return NextResponse.json({ ok: false, error: "topic이 필요합니다." }, { status: 400 });
    }

    const result = await generateMarketingCopy({ topic, channel });
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      const status = error.code === "NOT_LOGGED_IN" ? 401 : 403;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }
    if (error instanceof MarketerAgentError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 422 });
    }
    console.error("[POST /api/hq/marketing-copy]", error);
    return NextResponse.json({ ok: false, error: "카피 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
