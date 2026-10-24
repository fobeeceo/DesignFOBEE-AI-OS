import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DEMO_BUSINESSES } from '@/lib/ai-search/constants';
import { QUESTIONS, calcMentionStats } from '@/lib/ai-search/questions';
import { StatsCard } from '@/components/ai-search/StatsCard';
import { ResultsTable } from '@/components/ai-search/ResultsTable';
import { RunButton } from '@/components/ai-search/RunButton';
import type { AiSearchMeasurement } from '@/lib/ai-search/types';

export const metadata: Metadata = {
  title: 'AI 검색 진단 상세 — AI Headquarters',
  robots: { index: false, follow: false },
};

interface Props {
  params: { businessId: string };
}

/** DB 연결 전 빈 측정 데이터 — 모든 항목 미측정(null) */
const EMPTY_MEASUREMENTS: AiSearchMeasurement[] = [];

export default function AiSearchBusinessPage({ params }: Props) {
  const _biz = DEMO_BUSINESSES.find((b) => b.id === params.businessId);
  if (!_biz) notFound();
  const biz = _biz!;

  const stats = calcMentionStats(EMPTY_MEASUREMENTS, QUESTIONS.length);

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/hq/ai-search"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← AI 검색 진단
          </Link>
          <h1 className="mt-1 text-xl font-bold">{biz.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {biz.businessType} · 브랜드: {biz.brand}
          </p>
        </div>
        <Link
          href={`/hq/ai-search/${biz.id}/measure`}
          className="shrink-0 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
        >
          + 측정 입력
        </Link>
      </div>

      {/* AI 자동 측정 (Phase 3) */}
      <div className="rounded-2xl border p-4">
        <p className="mb-3 text-sm font-bold">AI 자동 측정 — Gemini Google Search</p>
        <RunButton businessId={biz.id} />
      </div>

      {/* DB 연결 전 안내 */}
      <div className="rounded-2xl border border-dashed border-amber-400/60 bg-amber-400/5 p-4">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          1단계 — DB 없이 구현된 화면입니다
        </p>
        <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
          Supabase 재개 및 DB 마이그레이션 승인 후 실제 측정 결과를 조회할 수 있습니다.
        </p>
      </div>

      {/* 측정 통계 카드 */}
      <StatsCard {...stats} />

      {/* 결과 테이블 */}
      <div>
        <h2 className="mb-3 text-sm font-bold">질문별 측정 결과</h2>
        <ResultsTable questions={QUESTIONS} measurements={EMPTY_MEASUREMENTS} />
      </div>
    </div>
  );
}
