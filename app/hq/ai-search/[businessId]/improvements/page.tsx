import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DEMO_BUSINESSES } from '@/lib/ai-search/constants';
import { QUESTIONS } from '@/lib/ai-search/questions';
import { GBRICK_STATIC_RESULTS } from '@/lib/ai-search/static-results';
import {
  GBRICK_IMPROVEMENT_TASKS,
  IMPROVEMENT_STATUS_LABEL,
  IMPROVEMENT_STATUS_COLOR,
} from '@/lib/ai-search/improvement-tasks';
import type { ImprovementTask } from '@/lib/ai-search/improvement-tasks';
import type { AnalystQuestionResult } from '@/lib/ai-search/analyst/types';
import { AnalystMentionBadge } from '@/components/ai-search/AnalystMentionBadge';

export const metadata: Metadata = {
  title: 'AI 검색 개선 과제 — AI Headquarters',
  robots: { index: false, follow: false },
};

interface Props {
  params: { businessId: string };
}

function getImprovementTasks(businessId: string): ImprovementTask[] {
  if (businessId === 'gbrick-coffee') return GBRICK_IMPROVEMENT_TASKS;
  return [];
}

function getResultsMap(businessId: string): Record<string, AnalystQuestionResult> {
  const results = businessId === 'gbrick-coffee' ? GBRICK_STATIC_RESULTS : [];
  return Object.fromEntries(results.map((r) => [r.questionCode, r]));
}

export default function ImprovementsPage({ params }: Props) {
  const biz = DEMO_BUSINESSES.find((b) => b.id === params.businessId);
  if (!biz) notFound();

  const tasks = getImprovementTasks(params.businessId);
  const questionMap = Object.fromEntries(QUESTIONS.map((q) => [q.questionCode, q.questionText]));
  const resultsMap = getResultsMap(params.businessId);

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-3">
          <Link
            href={`/hq/ai-search/${biz.id}`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← {biz.name} 진단 결과
          </Link>
          <Link
            href={`/hq/ai-search/${biz.id}/content-drafts`}
            className="ml-auto text-xs text-primary hover:text-primary/80"
          >
            콘텐츠 초안 →
          </Link>
        </div>
        <h1 className="mt-1 text-xl font-bold">개선 과제</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          미언급 질문별 문제·가설·실행 계획 — 결과 확인 전 성과를 주장하지 않습니다.
        </p>
      </div>

      {/* 과제 원칙 안내 */}
      <div className="rounded-2xl border border-dashed border-blue-400/40 bg-blue-400/5 p-4">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">기준 안내</p>
        <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/80">
          아래 &ldquo;개선 가설&rdquo;은 실행 전 가설입니다. 재측정으로 결과가 확인되기 전에는
          개선 효과를 주장하지 않습니다. 실행 완료 후 4주 뒤 동일 조건으로 재측정합니다.
        </p>
      </div>

      {/* 과제 목록 */}
      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">개선 과제가 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-border p-5">
              {/* 과제 헤더 */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{task.questionCode}</span>
                    {task.relatedQuestionCodes && task.relatedQuestionCodes.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        + {task.relatedQuestionCodes.join(' ')}
                      </span>
                    )}
                    {resultsMap[task.questionCode] && (
                      <AnalystMentionBadge status={resultsMap[task.questionCode].mentionStatus} />
                    )}
                    <span className={`text-xs font-semibold ${IMPROVEMENT_STATUS_COLOR[task.status]}`}>
                      {IMPROVEMENT_STATUS_LABEL[task.status]}
                    </span>
                    <span className="text-xs text-muted-foreground">담당: {task.assignee}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {questionMap[task.questionCode]}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0">
                  {task.customerApproved === null ? '승인 대기' :
                   task.customerApproved ? '✓ 승인' : '반려'}
                </div>
              </div>

              {/* 과제 상세 */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    발견된 문제
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">{task.problem}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    개선 가설 (미검증)
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{task.hypothesis}</p>
                </div>
              </div>

              <div className="mt-3 border-t border-border/50 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  실행 계획
                </p>
                <p className="mt-1 text-xs leading-relaxed">{task.contentPlan}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  게시 채널: {task.targetPlatform}
                </p>
              </div>

              {task.verificationResult && (
                <div className="mt-3 rounded-lg bg-muted/30 px-3 py-2">
                  <p className="text-xs font-semibold">
                    검증 결과: {task.verificationResult === 'IMPROVED' ? '✓ 개선됨' :
                               task.verificationResult === 'NO_CHANGE' ? '변화 없음' :
                               task.verificationResult === 'REGRESSION' ? '⚠ 역행' :
                               '데이터 불충분'}
                  </p>
                  {task.verifiedAt && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">확인일: {task.verifiedAt}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
