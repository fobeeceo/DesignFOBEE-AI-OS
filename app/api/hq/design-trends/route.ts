import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/auth/requireAdmin";
import { analyzeDesignTrends, DesignTrendError, type CompetitorInput } from "@/agents/designTrendAgent";

const OUR_SUMMARY =
  "DesignFOBEE 홈페이지: 브랜드 우선 Hero(공간 사진 풀블리드, 무로그인 AI 체험 CTA) → " +
  "포트폴리오(카테고리 필터: 전체/카페/오피스, 실 시공사진) → AI 인테리어 스튜디오(/design, 사진 업로드 → 스타일 선택 → Gemini 리디자인) → " +
  "상담 신청 CTA. 팔레트: 에디토리얼 톤(clay accent #b0562f).";

/**
 * POST /api/hq/design-trends
 * body: { competitors: [{ name, url }] }
 * AI 웹디자인 트렌드 전략가 — 경쟁사 홈페이지 fetch+Gemini 분석. 관리자 전용(Gemini 호출 = 비용 발생 → 인증 필수).
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const competitors: CompetitorInput[] = Array.isArray(body?.competitors) ? body.competitors : [];

    const report = await analyzeDesignTrends({ competitors, ourSummary: OUR_SUMMARY });
    return NextResponse.json({ ok: true, data: report });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      const status = error.code === "NOT_LOGGED_IN" ? 401 : 403;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }
    if (error instanceof DesignTrendError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 422 });
    }
    console.error("[POST /api/hq/design-trends]", error);
    return NextResponse.json({ ok: false, error: "경쟁사 분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
