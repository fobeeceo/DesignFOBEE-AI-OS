// D.6 — 월간 AI 검색 노출 리포트 데이터 모델
// DB 없이 정적 데이터로 동작한다. Supabase 승인 후 교체 가능한 구조.

import type { DashboardStats } from './dashboard-stats';
import type { ComparisonSummary } from './comparison';

export interface MonthlyReportMeta {
  businessId: string;
  businessName: string;
  /** YYYY-MM 형식 */
  reportMonth: string;
  generatedAt: string;
  /** 보고서 생성에 사용한 측정 회차 식별자 목록 */
  measurementRoundIds: string[];
}

export interface MonthlyReportSection {
  title: string;
  body: string;
  /** 근거 숫자나 링크 — UI에서 강조 표시 */
  highlights?: string[];
}

export interface MonthlyReport {
  meta: MonthlyReportMeta;
  /** 이달의 핵심 성과 요약 (3줄 이내) */
  executiveSummary: string;
  /** 측정 결과 스냅샷 */
  stats: DashboardStats;
  /** 전월 대비 변화 — 2차 측정 전 null */
  comparison: ComparisonSummary | null;
  /** 이달 실행한 개선 과제 */
  executedTasks: ExecutedTaskSummary[];
  /** 다음 달 계획 */
  nextMonthPlan: MonthlyReportSection;
  /** 대표 승인 여부 — false이면 대외 공유 불가 */
  approvedByCeo: boolean;
  approvedAt?: string;
}

export interface ExecutedTaskSummary {
  taskId: string;
  questionCode: string;
  platform: string;
  publishedAt?: string;
  /** 게시 후 언급 여부 변화 — 측정 전 null */
  verificationResult: 'IMPROVED' | 'NO_CHANGE' | 'REGRESSION' | 'INSUFFICIENT_DATA' | null;
}

/** 월간 리포트를 생성하는 팩토리 — 실제 데이터로 채울 준비가 된 빈 템플릿 반환 */
export function createEmptyMonthlyReport(
  businessId: string,
  businessName: string,
  reportMonth: string,
  stats: DashboardStats,
): MonthlyReport {
  return {
    meta: {
      businessId,
      businessName,
      reportMonth,
      generatedAt: new Date().toISOString().split('T')[0],
      measurementRoundIds: [],
    },
    executiveSummary: '',
    stats,
    comparison: null,
    executedTasks: [],
    nextMonthPlan: {
      title: '다음 달 계획',
      body: '',
      highlights: [],
    },
    approvedByCeo: false,
  };
}

/** 대표 승인 전 리포트를 대외 공유하지 않는다 (§0-2 원칙 6 — 되돌릴 수 없는 일은 대표 승인 후에) */
export function canShareReport(report: MonthlyReport): boolean {
  return report.approvedByCeo;
}
