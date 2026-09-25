import { getAiUsageSummary } from "@/services/aiUsageService";

// DB를 매 요청 실시간 집계하는 관리자 전용 페이지 — 빌드 시 정적 생성 대상에서 제외한다.
export const dynamic = "force-dynamic";

function usd(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * AI 렌더링 사용량 — 실제 고객 화면인 /design(로그인 없음) 기준.
 * 비용은 Gemini API 공개 단가 기준 "예상치"이며 실제 청구액과 다를 수 있다(원칙 2·3).
 */
export default async function AdminUsagePage() {
  const usage = await getAiUsageSummary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">AI 렌더링 사용량</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          실제 고객이 쓰는 /design 화면(생성 + 대화형 리파인) 사용 건수와 예상 Gemini API 비용.
          고객 본인의 API 키(BYOK)로 쓴 건수는 우리 비용이 아니므로 제외했습니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">오늘 생성 건수</p>
          <p className="mt-1 text-2xl font-bold">{usage.publicToday}건</p>
          <p className="mt-1 text-xs text-muted-foreground">예상 {usd(usage.publicEstimatedCostTodayUsd)}</p>
        </div>
        <div className="rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">이번 달 생성 건수</p>
          <p className="mt-1 text-2xl font-bold">{usage.publicMonth}건</p>
          <p className="mt-1 text-xs text-muted-foreground">예상 {usd(usage.publicEstimatedCostMonthUsd)}</p>
        </div>
        <div className="rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">누적 생성 건수</p>
          <p className="mt-1 text-2xl font-bold">{usage.publicTotal}건</p>
          <p className="mt-1 text-xs text-muted-foreground">예상 {usd(usage.publicEstimatedCostTotalUsd)}</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        건수는 public_generations 테이블에서 그때그때 계산한 실데이터입니다(하드코딩 없음). 비용은
        이미지 1장당 {usd(usage.costPerImageUsd)} 기준 추정치(2026-09 Gemini 3.1 Flash Image 공개
        단가 기준, 1024px 출력)이며 실제 청구액과 다를 수 있습니다. 정확한 확정 비용은 Google AI
        Studio(aistudio.google.com/apikey → 사용 중인 키 → 사용량) 또는 Google Cloud Console
        결제 리포트에서 확인하세요.
      </p>

      <details className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">
        <summary className="cursor-pointer font-semibold text-foreground">
          참고: 로그인 기반 프로젝트 플로우(/analyze) — 현재 사실상 미사용
        </summary>
        <p className="mt-2">
          누적 {usage.legacyLoginFlowTotal}건 · 무료 한도 소진 계정 {usage.legacyUsersAtFreeLimit}명.
          이 화면은 별도 로그인·프로젝트가 필요해 실제 고객 유입 경로가 아닙니다.
        </p>
      </details>
    </div>
  );
}
