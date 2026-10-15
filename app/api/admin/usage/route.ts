import { NextResponse } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/auth/requireAdmin";
import { getAiUsageSummary } from "@/services/aiUsageService";

/**
 * GET /api/admin/usage
 * AI 렌더링(생성+리파인) 사용량과 Gemini API 예상 비용을 실시간 집계해 반환한다.
 */
export async function GET() {
  try {
    await requireAdmin();

    const usage = await getAiUsageSummary();

    return NextResponse.json({ success: true, usage });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      const status = error.code === "NOT_LOGGED_IN" ? 401 : 403;
      return NextResponse.json({ success: false, error: error.message }, { status });
    }

    console.error("[GET /api/admin/usage]", error);
    return NextResponse.json(
      { success: false, error: "사용량 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
