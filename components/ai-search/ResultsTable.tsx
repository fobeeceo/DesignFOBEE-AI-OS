'use client';

import { MentionBadge } from './MentionBadge';
import { AI_SERVICES, QUESTION_CATEGORIES } from '@/lib/ai-search/constants';
import type { AiSearchMeasurement, AiSearchQuestion } from '@/lib/ai-search/types';

interface Props {
  questions: AiSearchQuestion[];
  measurements: AiSearchMeasurement[];
}

/** 질문별 측정 결과 테이블 — 미측정과 미언급을 시각적으로 구분한다. */
export function ResultsTable({ questions, measurements }: Props) {
  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="text-sm font-medium">등록된 질문이 없습니다</p>
        <p className="mt-2 text-xs text-muted-foreground">
          GBRICK_AI_Search_Baseline_Diagnostic_v1.0.xlsx 파일을 제공하면<br />
          질문 20개를 등록할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
            <th className="px-4 py-3">코드</th>
            <th className="px-4 py-3">질문</th>
            <th className="px-4 py-3">카테고리</th>
            <th className="px-4 py-3">AI 서비스</th>
            <th className="px-4 py-3">측정일</th>
            <th className="px-4 py-3">언급 여부</th>
            <th className="px-4 py-3">출처</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => {
            const m = measurements.find((meas) => meas.questionId === q.id);
            return (
              <tr key={q.id} className="border-b border-border/50 hover:bg-muted/10">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{q.questionCode}</td>
                <td className="px-4 py-3 max-w-xs">
                  <span className="line-clamp-2 text-sm leading-snug">{q.questionText}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {QUESTION_CATEGORIES[q.category]}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {m ? AI_SERVICES[m.aiService] : '-'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {m ? m.measuredAt.slice(0, 10) : '-'}
                </td>
                <td className="px-4 py-3">
                  <MentionBadge value={m?.isMentioned ?? null} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {m && m.sourceCount > 0 ? `${m.sourceCount}건` : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
