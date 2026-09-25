import { getAiUsageSummary } from "@/services/aiUsageService";

// DB를 매 요청 실시간 집계하는 관리자 전용 페이지 — 빌드 시 정적 생성 대상에서 제외한다.
export const dynamic = "force-dynamic";

function usd(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * AI 렌더링 사용량 — STEP 4+5(생성) + 대화형 리파인 건수를 design_generations에서 실시간 집계.
 * 비용은 Gemini API 공개 단가 기준 "예상치"이며 실제 청구액과 다를 수 있다(원칙 2·3).
 */
export default async function AdminUsagePage() {
  const usage = await getAiUsageSummary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">AI 렌더링 사용량</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI 리디자인 스튜디오(생성 + 대화형 리파인) 사용 건수와 예상 Gemini API 비용
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">오늘 생성 건수</p>
          <p className="mt-1 text-2xl font-bold">{usage.todayCount}건</p>
          <p className="mt-1 text-xs text-muted-foreground">예상 {usd(usage.estimatedCostTodayUsd)}</p>
        </div>
        <div className="rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">이번 달 생성 건수</p>
          <p className="mt-1 text-2xl font-bold">{usage.monthCount}건</p>
          <p className="mt-1 text-xs text-muted-foreground">예상 {usd(usage.estimatedCostMonthUsd)}</p>
        </div>
        <div className="rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">누적 생성 건수</p>
          <p className="mt-1 text-2xl font-bold">{usage.totalCount}건</p>
          <p className="mt-1 text-xs text-muted-foreground">예상 {usd(usage.estimatedCostTotalUsd)}</p>
        </div>
        <div className="rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">무료 체험 소진 사용자</p>
          <p className="mt-1 text-2xl font-bold">{usage.usersAtFreeLimit}명</p>
          <p className="mt-1 text-xs text-muted-foreground">상담 전환 잠재 고객</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        건수는 design_generations 테이블에서 그때그때 계산한 실데이터입니다(하드코딩 없음). 비용은
        이미지 1장당 {usd(usage.costPerImageUsd)} 기준 추정치(2026-09 Gemini 3.1 Flash Image 공개
        단가 기준, 1024px 출력)이며 실제 청구액과 다를 수 있습니다. 정확한 단가는 Google 공식
        가격표(ai.google.dev/gemini-api/docs/pricing)에서 주기적으로 재확인해 주세요.
      </p>
    </div>
  );
}
