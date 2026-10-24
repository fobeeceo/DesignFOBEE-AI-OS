/**
 * AI 검색 노출 대시보드 통계 계산
 * 기준: measurement-standard.md (docs/ai-search-business/)
 *
 * 핵심 규칙:
 *  - FAILED는 분모에서 제외 (FAILED ≠ NOT_MENTIONED)
 *  - 일반 검색(non-BRAND)과 브랜드 직접(BRAND)을 분리 집계
 */

import type { AnalystMentionStatus, AnalystQuestionResult } from './analyst/types';
import type { AiSearchQuestion } from './types';

export interface CategoryStats {
  /** 총 질문 수 */
  total: number;
  /** FAILED 수 */
  failed: number;
  /** 성공 분모 (total - failed - unmeasured) */
  successDenominator: number;
  /** MENTIONED 수 */
  mentioned: number;
  /** NOT_MENTIONED 수 */
  notMentioned: number;
  /** 언급률 (%) — null이면 측정 데이터 없음 */
  mentionRate: number | null;
}

export interface DashboardStats {
  /** 전체 통합 */
  overall: CategoryStats & { unmeasured: number };
  /** 일반 검색 (브랜드명 미포함 질문, non-BRAND category) */
  general: CategoryStats;
  /** 브랜드 직접 (브랜드명 포함 질문, BRAND category) */
  brand: CategoryStats;
  /** 측정 일시 (가장 최근) */
  measuredAt?: string;
  /** AI 모델 */
  model?: string;
}

function calcCategory(results: AnalystQuestionResult[]): CategoryStats {
  const failed = results.filter((r) => r.mentionStatus === 'FAILED').length;
  const unmeasured = results.filter((r) => r.mentionStatus === 'UNMEASURED').length;
  const mentioned = results.filter((r) => r.mentionStatus === 'MENTIONED').length;
  const notMentioned = results.filter((r) => r.mentionStatus === 'NOT_MENTIONED').length;
  const successDenominator = results.length - failed - unmeasured;
  return {
    total: results.length,
    failed,
    successDenominator,
    mentioned,
    notMentioned,
    mentionRate:
      successDenominator > 0
        ? Math.round((mentioned / successDenominator) * 1000) / 10
        : null,
  };
}

export function calcDashboardStats(
  results: AnalystQuestionResult[],
  questions: AiSearchQuestion[],
  meta?: { measuredAt?: string; model?: string },
): DashboardStats {
  const brandCodes = new Set(
    questions.filter((q) => q.category === 'BRAND').map((q) => q.questionCode),
  );

  const generalResults = results.filter((r) => !brandCodes.has(r.questionCode));
  const brandResults = results.filter((r) => brandCodes.has(r.questionCode));

  const overallBase = calcCategory(results);
  const unmeasured = results.filter((r) => r.mentionStatus === 'UNMEASURED').length;

  return {
    overall: { ...overallBase, unmeasured },
    general: calcCategory(generalResults),
    brand: calcCategory(brandResults),
    measuredAt: meta?.measuredAt,
    model: meta?.model,
  };
}
