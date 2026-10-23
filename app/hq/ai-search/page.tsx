import type { Metadata } from 'next';
import Link from 'next/link';
import { DEMO_BUSINESSES, FACT_CHECK_STATUS_LABEL } from '@/lib/ai-search/constants';
import { QUESTIONS } from '@/lib/ai-search/questions';

export const metadata: Metadata = {
  title: 'AI 검색 진단 — AI Headquarters',
  robots: { index: false, follow: false },
};

/** AI 검색 노출 진단 개요 페이지 — 사업체별 측정 현황 카드 */
export default function AiSearchPage() {
  const questionCount = QUESTIONS.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">🔍 AI 검색 노출 진단</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ChatGPT · Gemini 등 AI 서비스에서 사업체가 얼마나 노출되는지 측정하고 개선합니다.
        </p>
      </div>

      {/* DB 연결 전 안내 */}
      <div className="rounded-2xl border border-dashed border-amber-400/60 bg-amber-400/5 p-4">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          1단계 — DB 없이 구현된 화면입니다
        </p>
        <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
          Supabase 재개 및 DB 마이그레이션 승인 후 실제 측정 데이터를 저장·조회할 수 있습니다.
          현재는 화면 구조와 입력 흐름을 확인하는 단계입니다.
        </p>
      </div>

      {/* 진단 현황 개요 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-xs text-muted-foreground">진단 대상 사업체</p>
          <p className="mt-1 text-2xl font-bold">{DEMO_BUSINESSES.length}개</p>
        </div>
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5">
          <p className="text-xs text-muted-foreground">등록된 질문</p>
          {questionCount > 0 ? (
            <p className="mt-1 text-2xl font-bold">{questionCount}개</p>
          ) : (
            <p className="mt-1 text-2xl font-bold text-muted-foreground">-</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {questionCount > 0 ? '활성 질문' : '엑셀 파일 제공 후 등록'}
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5">
          <p className="text-xs text-muted-foreground">총 측정 건수</p>
          <p className="mt-1 text-2xl font-bold text-muted-foreground">-</p>
          <p className="mt-1 text-xs text-muted-foreground">DB 연결 후 집계</p>
        </div>
      </div>

      {/* 사업체 카드 목록 */}
      <div>
        <h2 className="mb-3 text-sm font-bold">사업체별 진단 현황</h2>
        <div className="flex flex-col gap-3">
          {DEMO_BUSINESSES.map((biz) => (
            <div key={biz.id} className="rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{biz.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {biz.businessType} · 브랜드: {biz.brand}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                    사실확인: {FACT_CHECK_STATUS_LABEL[biz.factCheckStatus]}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-muted-foreground">-</p>
                  <p className="text-xs text-muted-foreground">측정 없음</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <Link
                  href={`/hq/ai-search/${biz.id}`}
                  className="rounded-lg border border-border px-4 py-1.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                >
                  진단 결과 보기
                </Link>
                <Link
                  href={`/hq/ai-search/${biz.id}/measure`}
                  className="rounded-lg bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  + 측정 입력
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 엑셀 파일 안내 */}
      {questionCount === 0 && (
        <div className="rounded-2xl border border-border p-5">
          <h2 className="text-sm font-bold">다음 단계</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">1</span>
              <span>
                <span className="font-medium text-foreground">엑셀 파일 제공</span>
                {' — '}GBRICK_AI_Search_Baseline_Diagnostic_v1.0.xlsx의 질문 20개를 등록합니다.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">2</span>
              <span>
                <span className="font-medium text-foreground">Supabase 재개 + DB 마이그레이션</span>
                {' — '}측정 데이터를 저장할 수 있습니다.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">3</span>
              <span>
                <span className="font-medium text-foreground">첫 측정 시작</span>
                {' — '}ChatGPT · Gemini에 질문하고 결과를 입력합니다.
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
