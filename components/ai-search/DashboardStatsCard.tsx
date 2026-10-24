import type { DashboardStats } from '@/lib/ai-search/dashboard-stats';

interface Props {
  stats: DashboardStats;
}

function RateDisplay({ rate, numerator, denominator }: { rate: number | null; numerator: number; denominator: number }) {
  if (rate === null || denominator === 0) {
    return <p className="mt-1 text-2xl font-bold tracking-tight text-muted-foreground">-</p>;
  }
  return (
    <>
      <p className="mt-1 text-2xl font-bold tracking-tight">{rate}%</p>
      <p className="mt-1 text-xs text-muted-foreground">{numerator}/{denominator}건 언급</p>
    </>
  );
}

/**
 * AI 검색 노출 대시보드 통계 카드
 * 일반 검색 / 브랜드 직접 / 전체를 별도 집계한다.
 * FAILED는 분모에서 제외하고, 별도로 표시한다.
 */
export function DashboardStatsCard({ stats }: Props) {
  const { overall, general, brand } = stats;

  return (
    <div className="flex flex-col gap-4">
      {/* 핵심 지표 3종 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">일반 검색 노출률</p>
          <RateDisplay
            rate={general.mentionRate}
            numerator={general.mentioned}
            denominator={general.successDenominator}
          />
          <p className="mt-1 text-xs text-muted-foreground">브랜드명 없이 물어볼 때</p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">브랜드 직접 노출률</p>
          <RateDisplay
            rate={brand.mentionRate}
            numerator={brand.mentioned}
            denominator={brand.successDenominator}
          />
          <p className="mt-1 text-xs text-muted-foreground">브랜드명 포함 질문</p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">전체 노출률</p>
          <RateDisplay
            rate={overall.mentionRate}
            numerator={overall.mentioned}
            denominator={overall.successDenominator}
          />
          <p className="mt-1 text-xs text-muted-foreground">성공 분모 {overall.successDenominator}문항 기준</p>
        </div>
      </div>

      {/* 세부 집계 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">언급됨</p>
          <p className="mt-1 text-xl font-bold text-green-600">{overall.mentioned}건</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">미언급</p>
          <p className="mt-1 text-xl font-bold">{overall.notMentioned}건</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">측정 실패</p>
          <p className={`mt-1 text-xl font-bold ${overall.failed > 0 ? 'text-amber-600' : ''}`}>
            {overall.failed}건
          </p>
          {overall.failed > 0 && (
            <p className="mt-0.5 text-[10px] text-amber-600/80">분모에서 제외</p>
          )}
        </div>
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">미측정</p>
          <p className="mt-1 text-xl font-bold text-muted-foreground">{overall.unmeasured}건</p>
        </div>
      </div>

      {/* 측정 메타 */}
      {(stats.measuredAt ?? stats.model) && (
        <p className="text-xs text-muted-foreground">
          {stats.measuredAt && `측정일: ${stats.measuredAt}`}
          {stats.measuredAt && stats.model && ' · '}
          {stats.model && `모델: ${stats.model}`}
        </p>
      )}
    </div>
  );
}
