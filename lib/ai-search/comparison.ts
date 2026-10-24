// D.5 — Before/After 비교 구조
// 1차 측정(기준선) + 2차 측정(콘텐츠 게시 4주 후) 데이터를 비교한다.
// 2차 측정 데이터 미확보 시 second를 null로 남긴다 (§0-2 원칙 2 — 없으면 없다고 한다).

import type { AnalystMentionStatus } from './analyst/types';
import type { DashboardStats } from './dashboard-stats';

export interface MeasurementRound {
  /** 측정 회차 식별자 */
  roundId: string;
  businessId: string;
  measuredAt: string;
  model: string;
  timeoutMs: number;
  stats: DashboardStats;
}

export interface QuestionComparison {
  questionCode: string;
  questionText: string;
  category: string;
  /** 1차 측정 결과 */
  firstStatus: AnalystMentionStatus;
  firstEvidence?: string;
  firstFailureReason?: string;
  /** 2차 측정 결과 — 미측정 시 null */
  secondStatus: AnalystMentionStatus | null;
  secondEvidence?: string;
  secondFailureReason?: string;
  /** 변화 방향 */
  change: ComparisonChange;
}

/** 측정 간 변화 방향 */
export type ComparisonChange =
  | 'IMPROVED'     // NOT_MENTIONED → MENTIONED
  | 'REGRESSED'    // MENTIONED → NOT_MENTIONED
  | 'STABLE_ON'    // MENTIONED → MENTIONED
  | 'STABLE_OFF'   // NOT_MENTIONED → NOT_MENTIONED
  | 'RECOVERED'    // FAILED → MENTIONED
  | 'STILL_FAILED' // FAILED → FAILED
  | 'NOT_MEASURED'; // 2차 측정 없음

export interface BeforeAfterComparison {
  businessId: string;
  first: MeasurementRound;
  /** 2차 측정 완료 전 null — 게시 후 4주 경과 시 추가 */
  second: MeasurementRound | null;
  questions: QuestionComparison[];
  summary: ComparisonSummary | null;
}

export interface ComparisonSummary {
  improved: number;
  regressed: number;
  stable: number;
  stillFailed: number;
  recovered: number;
  /** 전체 노출률 변화 (percentage points) — second 없으면 null */
  overallRateDelta: number | null;
  generalRateDelta: number | null;
  brandRateDelta: number | null;
}

/** 두 측정 라운드로 QuestionComparison 배열을 생성한다. */
export function buildQuestionComparisons(
  firstStatuses: Array<{ questionCode: string; questionText: string; category: string; status: AnalystMentionStatus; evidence?: string; failureReason?: string }>,
  secondStatuses: Array<{ questionCode: string; status: AnalystMentionStatus; evidence?: string; failureReason?: string }> | null,
): QuestionComparison[] {
  const secondMap = secondStatuses
    ? Object.fromEntries(secondStatuses.map((s) => [s.questionCode, s]))
    : {};

  return firstStatuses.map((first) => {
    const second = secondMap[first.questionCode] ?? null;
    const change = deriveChange(first.status, second?.status ?? null);
    return {
      questionCode: first.questionCode,
      questionText: first.questionText,
      category: first.category,
      firstStatus: first.status,
      firstEvidence: first.evidence,
      firstFailureReason: first.failureReason,
      secondStatus: second?.status ?? null,
      secondEvidence: second?.evidence,
      secondFailureReason: second?.failureReason,
      change,
    };
  });
}

function deriveChange(
  first: AnalystMentionStatus,
  second: AnalystMentionStatus | null,
): ComparisonChange {
  if (second === null) return 'NOT_MEASURED';
  if (first === 'FAILED' && second === 'FAILED') return 'STILL_FAILED';
  if (first === 'FAILED' && second === 'MENTIONED') return 'RECOVERED';
  if (first === 'NOT_MENTIONED' && second === 'MENTIONED') return 'IMPROVED';
  if (first === 'MENTIONED' && second === 'NOT_MENTIONED') return 'REGRESSED';
  if (first === 'MENTIONED' && second === 'MENTIONED') return 'STABLE_ON';
  return 'STABLE_OFF';
}

/** 비교 요약을 계산한다. second가 없으면 null. */
export function buildComparisonSummary(
  questions: QuestionComparison[],
  first: DashboardStats,
  second: DashboardStats | null,
): ComparisonSummary | null {
  if (second === null) return null;

  const counts = { improved: 0, regressed: 0, stable: 0, stillFailed: 0, recovered: 0 };
  for (const q of questions) {
    if (q.change === 'IMPROVED') counts.improved++;
    else if (q.change === 'REGRESSED') counts.regressed++;
    else if (q.change === 'STABLE_ON' || q.change === 'STABLE_OFF') counts.stable++;
    else if (q.change === 'STILL_FAILED') counts.stillFailed++;
    else if (q.change === 'RECOVERED') counts.recovered++;
  }

  const delta = (a: number | null, b: number | null) =>
    a !== null && b !== null ? Math.round((b - a) * 10) / 10 : null;

  return {
    ...counts,
    overallRateDelta: delta(first.overall.mentionRate, second.overall.mentionRate),
    generalRateDelta: delta(first.general.mentionRate, second.general.mentionRate),
    brandRateDelta: delta(first.brand.mentionRate, second.brand.mentionRate),
  };
}
