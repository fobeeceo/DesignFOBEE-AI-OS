'use client';

import { AnalystMentionBadge } from './AnalystMentionBadge';
import { QUESTION_CATEGORIES } from '@/lib/ai-search/constants';
import type { AnalystQuestionResult } from '@/lib/ai-search/analyst/types';
import type { AiSearchQuestion } from '@/lib/ai-search/types';

interface Props {
  questions: AiSearchQuestion[];
  results: AnalystQuestionResult[];
}

/** 질문별 AI 자동 측정 결과 테이블 — MENTIONED / NOT_MENTIONED / FAILED / UNMEASURED 4상태 */
export function AnalystResultsTable({ questions, results }: Props) {
  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="text-sm font-medium">등록된 질문이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
            <th className="px-3 py-3 w-16">코드</th>
            <th className="px-3 py-3">질문</th>
            <th className="px-3 py-3 w-24">카테고리</th>
            <th className="px-3 py-3 w-24">상태</th>
            <th className="px-3 py-3">증거 / 사유</th>
            <th className="px-3 py-3 w-24">측정일</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => {
            const r = results.find((res) => res.questionCode === q.questionCode);
            const status = r?.mentionStatus ?? 'UNMEASURED';
            const isFailed = status === 'FAILED';
            return (
              <tr
                key={q.id}
                className={`border-b border-border/50 hover:bg-muted/10 ${isFailed ? 'bg-amber-500/5' : ''}`}
              >
                <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{q.questionCode}</td>
                <td className="px-3 py-3 max-w-xs">
                  <span className="line-clamp-2 text-sm leading-snug">{q.questionText}</span>
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {QUESTION_CATEGORIES[q.category]}
                </td>
                <td className="px-3 py-3">
                  <AnalystMentionBadge status={status} />
                </td>
                <td className="px-3 py-3 max-w-xs">
                  {r?.evidence && (
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {r.evidence}
                    </span>
                  )}
                  {r?.failureReason && (
                    <span className="text-xs text-amber-600/80">{r.failureReason}</span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {r?.measuredAt ?? '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
