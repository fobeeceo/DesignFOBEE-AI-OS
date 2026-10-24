import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DEMO_BUSINESSES } from '@/lib/ai-search/constants';
import { QUESTIONS } from '@/lib/ai-search/questions';
import { GBRICK_STATIC_RESULTS, GBRICK_STATIC_META } from '@/lib/ai-search/static-results';
import { calcDashboardStats } from '@/lib/ai-search/dashboard-stats';
import { DashboardStatsCard } from '@/components/ai-search/DashboardStatsCard';
import { AnalystResultsTable } from '@/components/ai-search/AnalystResultsTable';
import { RunButton } from '@/components/ai-search/RunButton';
import type { AnalystQuestionResult } from '@/lib/ai-search/analyst/types';

export const metadata: Metadata = {
  title: 'AI 검색 진단 상세 — AI Headquarters',
  robots: { index: false, follow: false },
};

interface Props {
  params: { businessId: string };
}

/** businessId → 정적 결과 데이터 매핑 (DB 연결 전) */
function getStaticResults(businessId: string): {
  results: AnalystQuestionResult[];
  meta?: { measuredAt?: string; model?: string };
} {
  if (businessId === 'gbrick-coffee') {
    return { results: GBRICK_STATIC_RESULTS, meta: GBRICK_STATIC_META };
  }
  return { results: [] };
}

export default function AiSearchBusinessPage({ params }: Props) {
  const biz = DEMO_BUSINESSES.find((b) => b.id === params.businessId);
  if (!biz) notFound();

  const { results, meta } = getStaticResults(params.businessId);
  const stats = calcDashboardStats(results, QUESTIONS, meta);
  const hasResults = results.some((r) => r.mentionStatus !== 'UNMEASURED');

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/hq/ai-search" className="text-xs text-muted-foreground hover:text-foreground">
            ← AI 검색 진단
          </Link>
          <h1 className="mt-1 text-xl font-bold">{biz.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {biz.businessType} · 브랜드: {biz.brand}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 text-right sm:flex-row sm:items-center">
          <Link
            href={`/hq/ai-search/${biz.id}/improvements`}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            개선 과제
          </Link>
          <Link
            href={`/hq/ai-search/${biz.id}/measure`}
            className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            + 측정 입력
          </Link>
        </div>
      </div>

      {/* AI 자동 측정 */}
      <div className="rounded-2xl border p-4">
        <p className="mb-3 text-sm font-bold">AI 자동 측정 — Gemini Google Search</p>
        <RunButton businessId={biz.id} />
      </div>

      {/* DB 연결 전 안내 */}
      {!hasResults && (
        <div className="rounded-2xl border border-dashed border-amber-400/60 bg-amber-400/5 p-4">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            DB 없이 표시 중인 화면입니다
          </p>
          <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
            Supabase 재개 및 DB 마이그레이션 승인 후 실측 데이터를 저장·조회할 수 있습니다.
          </p>
        </div>
      )}

      {/* 측정 통계 — 기능 A */}
      <div>
        <h2 className="mb-3 text-sm font-bold">노출 현황</h2>
        <DashboardStatsCard stats={stats} />
      </div>

      {/* 결과 테이블 */}
      <div>
        <h2 className="mb-3 text-sm font-bold">질문별 측정 결과</h2>
        <AnalystResultsTable questions={QUESTIONS} results={results} />
      </div>
    </div>
  );
}
