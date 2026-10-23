import type { MentionStats } from '@/lib/ai-search/types';

interface Props extends MentionStats {}

/** 언급률·측정 현황 집계 카드 4개 — 미측정(0%)과 측정없음(-)을 명확히 구분한다. */
export function StatsCard({ totalMeasured, totalMentioned, mentionRate, totalUnmeasured, totalQuestions }: Props) {
  const hasMeasurement = totalMeasured > 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-2xl border border-border bg-background p-5">
        <p className="text-xs text-muted-foreground">언급률</p>
        {hasMeasurement ? (
          <p className="mt-1 text-2xl font-bold tracking-tight">{mentionRate}%</p>
        ) : (
          <p className="mt-1 text-2xl font-bold tracking-tight text-muted-foreground">-</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {hasMeasurement
            ? `${totalMentioned}/${totalMeasured}건 언급`
            : '측정 없음'}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-background p-5">
        <p className="text-xs text-muted-foreground">총 측정</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{totalMeasured}건</p>
        <p className="mt-1 text-xs text-muted-foreground">전체 {totalQuestions}개 질문 중</p>
      </div>

      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5">
        <p className="text-xs text-muted-foreground">미측정</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-muted-foreground">{totalUnmeasured}건</p>
        <p className="mt-1 text-xs text-muted-foreground">측정 대기 중</p>
      </div>

      <div className="rounded-2xl border border-border bg-background p-5">
        <p className="text-xs text-muted-foreground">언급 건수</p>
        <p className={`mt-1 text-2xl font-bold tracking-tight ${totalMentioned > 0 ? 'text-green-600' : ''}`}>
          {totalMentioned}건
        </p>
        <p className="mt-1 text-xs text-muted-foreground">AI 서비스에서 언급됨</p>
      </div>
    </div>
  );
}
