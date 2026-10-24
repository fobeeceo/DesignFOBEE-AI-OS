'use client';

import type { ContentDraft } from '@/lib/ai-search/content-drafts';
import {
  CONTENT_PLATFORM_LABEL,
  CONTENT_DRAFT_STATUS_LABEL,
  CONTENT_DRAFT_STATUS_COLOR,
  canPublish,
} from '@/lib/ai-search/content-drafts';

interface Props {
  draft: ContentDraft;
}

/**
 * 콘텐츠 초안 카드 — 대표 검토·승인 워크플로우 표시
 * 게시 버튼은 canPublish() = true 일 때만 활성화 (대표 승인 + 사실 확인 완료)
 */
export function ContentDraftCard({ draft }: Props) {
  const publishable = canPublish(draft);

  return (
    <div className="rounded-2xl border border-border p-5">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{draft.targetQuestionCode}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            {CONTENT_PLATFORM_LABEL[draft.platform]}
          </span>
          <span className={`text-xs font-semibold ${CONTENT_DRAFT_STATUS_COLOR[draft.status]}`}>
            {CONTENT_DRAFT_STATUS_LABEL[draft.status]}
          </span>
          {!draft.factChecked && (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600">
              사실 미확인
            </span>
          )}
        </div>
        {publishable && (
          <span className="shrink-0 rounded-full bg-green-500/10 px-3 py-0.5 text-xs font-semibold text-green-600">
            게시 가능
          </span>
        )}
      </div>

      {/* 제목 */}
      <p className="mt-2 font-semibold text-sm">{draft.title}</p>

      {/* 키워드 */}
      {draft.keywords.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {draft.keywords.map((kw) => (
            <span
              key={kw}
              className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              #{kw}
            </span>
          ))}
        </div>
      )}

      {/* 본문 미리보기 */}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-3">
        {draft.body}
      </p>

      {/* 사실 확인 항목 */}
      {draft.factCheckItems && draft.factCheckItems.length > 0 && (
        <div className="mt-3 border-t border-border/50 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            사실 확인 필요 항목
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {draft.factCheckItems.map((item) => (
              <li key={item} className="text-xs text-amber-600">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 대표 피드백 */}
      {draft.ceoFeedback && (
        <div className="mt-3 rounded-lg bg-blue-500/5 px-3 py-2">
          <p className="text-[10px] font-semibold text-blue-600">대표 검토 의견</p>
          <p className="mt-0.5 text-xs text-blue-700">{draft.ceoFeedback}</p>
        </div>
      )}

      {/* 게시 불가 안내 */}
      {!publishable && draft.status !== 'DRAFT' && (
        <p className="mt-3 text-[10px] text-muted-foreground">
          {!draft.factChecked
            ? '사실 확인 완료 후 게시 가능합니다 (§0-2 원칙 2).'
            : '대표 승인 완료 후 게시 가능합니다 (service-workflow.md §8).'}
        </p>
      )}
    </div>
  );
}
