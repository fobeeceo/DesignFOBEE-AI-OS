import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DEMO_BUSINESSES } from '@/lib/ai-search/constants';
import type { ContentDraft } from '@/lib/ai-search/content-drafts';
import { GBRICK_STATIC_DRAFTS } from '@/lib/ai-search/static-drafts';
import { ContentDraftCard } from '@/components/ai-search/ContentDraftCard';

export const metadata: Metadata = {
  title: '콘텐츠 초안 — AI 검색 진단',
  robots: { index: false, follow: false },
};

interface Props {
  params: { businessId: string };
}

function getContentDrafts(businessId: string): ContentDraft[] {
  if (businessId === 'gbrick-coffee') return GBRICK_STATIC_DRAFTS;
  return [];
}

export default function ContentDraftsPage({ params }: Props) {
  const biz = DEMO_BUSINESSES.find((b) => b.id === params.businessId);
  if (!biz) notFound();

  const drafts = getContentDrafts(params.businessId);

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div>
        <Link
          href={`/hq/ai-search/${biz.id}/improvements`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← 개선 과제
        </Link>
        <h1 className="mt-1 text-xl font-bold">콘텐츠 초안</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          AI 작성 초안 — 대표 승인 + 사실 확인 완료 후 외부 게시
        </p>
      </div>

      {/* 승인 워크플로우 안내 */}
      <div className="rounded-2xl border border-dashed border-amber-400/60 bg-amber-400/5 p-4">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          외부 게시 전 필수 확인 사항
        </p>
        <ol className="mt-2 space-y-1 text-xs text-amber-600/90 dark:text-amber-400/80 list-decimal list-inside">
          <li>AI 초안 작성 완료</li>
          <li>대표 검토 → 브랜드 톤 확인 · 사실 여부 확인</li>
          <li>고객(점주) 확인 → 메뉴·가격·영업시간 사실 검증</li>
          <li>승인 완료 후 대표가 직접 외부 플랫폼 게시</li>
        </ol>
        <p className="mt-2 text-[10px] text-amber-600/70 dark:text-amber-400/60">
          service-workflow.md §8 · §0-2 원칙 2 (없으면 없다고 한다)
        </p>
      </div>

      {/* 초안 목록 */}
      {drafts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm font-semibold text-muted-foreground">
            작성된 콘텐츠 초안이 없습니다
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            개선 과제에서 콘텐츠 초안 작성을 요청하거나,
            <br />
            Gemini 자동 측정 후 AI가 초안을 생성합니다.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {drafts.map((draft) => (
            <ContentDraftCard key={draft.id} draft={draft} />
          ))}
        </div>
      )}
    </div>
  );
}
