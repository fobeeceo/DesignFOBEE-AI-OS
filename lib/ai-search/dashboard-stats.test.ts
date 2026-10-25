import { describe, expect, it } from 'vitest';
import { calcDashboardStats } from './dashboard-stats';
import { QUESTIONS } from './questions';
import { GBRICK_STATIC_RESULTS, GBRICK_STATIC_META } from './static-results';
import type { AnalystQuestionResult } from './analyst/types';
import type { AiSearchQuestion } from './types';

// 테스트용 결과 생성 헬퍼
function makeResult(
  questionCode: string,
  status: AnalystQuestionResult['mentionStatus'],
): AnalystQuestionResult {
  return {
    questionId: questionCode,
    questionCode,
    questionText: `${questionCode} 테스트 질문`,
    aiService: 'GEMINI',
    mentionStatus: status,
    answerSummary: '',
    sourceUrls: [],
    measuredAt: '2026-10-24',
  };
}

// 테스트용 질문 생성 헬퍼
function makeQuestion(code: string, category: AiSearchQuestion['category']): AiSearchQuestion {
  return {
    id: code,
    questionCode: code,
    questionText: `${code} 질문`,
    category,
    searchIntent: 'test',
    isActive: true,
    version: 1,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
}

describe('calcDashboardStats — FAILED ≠ NOT_MENTIONED (핵심 불변 규칙)', () => {
  it('FAILED는 분모에서 제외된다', () => {
    const questions = [makeQuestion('Q01', 'LOCATION'), makeQuestion('Q02', 'LOCATION')];
    const results = [makeResult('Q01', 'MENTIONED'), makeResult('Q02', 'FAILED')];
    const stats = calcDashboardStats(results, questions);
    // Q02가 FAILED이므로 분모는 1 (Q01만)
    expect(stats.overall.successDenominator).toBe(1);
    expect(stats.overall.failed).toBe(1);
    expect(stats.overall.mentionRate).toBe(100); // 1/1
  });

  it('FAILED를 NOT_MENTIONED로 계산하면 언급률이 달라진다 — 올바른 계산 확인', () => {
    const questions = [
      makeQuestion('Q01', 'LOCATION'),
      makeQuestion('Q02', 'LOCATION'),
      makeQuestion('Q03', 'LOCATION'),
    ];
    const results = [
      makeResult('Q01', 'MENTIONED'),
      makeResult('Q02', 'NOT_MENTIONED'),
      makeResult('Q03', 'FAILED'),
    ];
    const stats = calcDashboardStats(results, questions);
    // 올바른 계산: 분모 = 3 - 1(FAILED) = 2, 언급률 = 1/2 = 50%
    expect(stats.overall.successDenominator).toBe(2);
    expect(stats.overall.mentionRate).toBe(50);
    // FAILED가 NOT_MENTIONED로 처리됐다면 분모 = 3, 언급률 = 33.3% (잘못된 값)
    expect(stats.overall.mentionRate).not.toBe(33.3);
  });

  it('UNMEASURED도 분모에서 제외된다', () => {
    const questions = [
      makeQuestion('Q01', 'BRAND'),
      makeQuestion('Q02', 'BRAND'),
      makeQuestion('Q03', 'BRAND'),
    ];
    const results = [
      makeResult('Q01', 'MENTIONED'),
      makeResult('Q02', 'UNMEASURED'),
      makeResult('Q03', 'NOT_MENTIONED'),
    ];
    const stats = calcDashboardStats(results, questions);
    expect(stats.overall.successDenominator).toBe(2); // UNMEASURED 제외
    expect(stats.overall.mentionRate).toBe(50); // 1/2
  });

  it('전체 FAILED면 mentionRate는 null', () => {
    const questions = [makeQuestion('Q01', 'MENU')];
    const results = [makeResult('Q01', 'FAILED')];
    const stats = calcDashboardStats(results, questions);
    expect(stats.overall.mentionRate).toBeNull();
    expect(stats.overall.successDenominator).toBe(0);
  });
});

describe('calcDashboardStats — 카테고리 분리 (일반 vs 브랜드)', () => {
  it('BRAND 카테고리와 일반 카테고리를 분리 집계한다', () => {
    const questions = [
      makeQuestion('Q01', 'LOCATION'),
      makeQuestion('Q02', 'MENU'),
      makeQuestion('Q03', 'BRAND'),
      makeQuestion('Q04', 'BRAND'),
    ];
    const results = [
      makeResult('Q01', 'NOT_MENTIONED'),
      makeResult('Q02', 'MENTIONED'),
      makeResult('Q03', 'MENTIONED'),
      makeResult('Q04', 'MENTIONED'),
    ];
    const stats = calcDashboardStats(results, questions);
    expect(stats.general.total).toBe(2);
    expect(stats.general.mentioned).toBe(1);
    expect(stats.brand.total).toBe(2);
    expect(stats.brand.mentioned).toBe(2);
    expect(stats.brand.mentionRate).toBe(100);
  });

  it('일반 검색 FAILED는 일반 분모에서만 제외된다', () => {
    const questions = [
      makeQuestion('Q01', 'LOCATION'),
      makeQuestion('Q02', 'LOCATION'),
      makeQuestion('Q03', 'BRAND'),
    ];
    const results = [
      makeResult('Q01', 'MENTIONED'),
      makeResult('Q02', 'FAILED'),
      makeResult('Q03', 'MENTIONED'),
    ];
    const stats = calcDashboardStats(results, questions);
    expect(stats.general.failed).toBe(1);
    expect(stats.general.successDenominator).toBe(1);
    expect(stats.brand.failed).toBe(0);
    expect(stats.brand.successDenominator).toBe(1);
  });
});

describe('calcDashboardStats — GBRICK Coffee 기준선 검증 (2026-10-24)', () => {
  // Phase 6 (2026-10-24): Q03 → NOT_MENTIONED (재측정 완료), FAILED 0건
  it('20문항 전체: MENTIONED 6, NOT_MENTIONED 14, FAILED 0', () => {
    const stats = calcDashboardStats(GBRICK_STATIC_RESULTS, QUESTIONS, GBRICK_STATIC_META);

    expect(stats.overall.total).toBe(20);
    expect(stats.overall.mentioned).toBe(6);
    expect(stats.overall.notMentioned).toBe(14);
    expect(stats.overall.failed).toBe(0);
  });

  it('일반 검색: 15문항 전체 측정 완료, MENTIONED 1 (노출률 6.7%)', () => {
    const stats = calcDashboardStats(GBRICK_STATIC_RESULTS, QUESTIONS, GBRICK_STATIC_META);

    // 일반 검색 = non-BRAND. BRAND 5개(Q16-Q20), 나머지 15개 (Q03 포함 전체 측정 완료)
    expect(stats.general.successDenominator).toBe(15);
    expect(stats.general.mentioned).toBe(1);
    expect(stats.general.mentionRate).toBe(6.7);
  });

  it('브랜드 직접: 5문항, MENTIONED 5 (노출률 100%)', () => {
    const stats = calcDashboardStats(GBRICK_STATIC_RESULTS, QUESTIONS, GBRICK_STATIC_META);

    expect(stats.brand.total).toBe(5);
    expect(stats.brand.mentioned).toBe(5);
    expect(stats.brand.mentionRate).toBe(100);
  });

  // Phase 6 (2026-10-24): FAILED 0 → 전체 20문항 성공 분모, 언급률 6/20 = 30%
  it('전체 노출률: 30% (6/20 — FAILED 0, 전 문항 측정 완료)', () => {
    const stats = calcDashboardStats(GBRICK_STATIC_RESULTS, QUESTIONS, GBRICK_STATIC_META);

    expect(stats.overall.successDenominator).toBe(20);
    expect(stats.overall.mentionRate).toBe(30);
  });

  it('Q03은 NOT_MENTIONED — Phase 6 재측정 결과 (FAILED 아님)', () => {
    const q03 = GBRICK_STATIC_RESULTS.find(
      (r: AnalystQuestionResult) => r.questionCode === 'Q03',
    );
    expect(q03).toBeDefined();
    expect(q03!.mentionStatus).toBe('NOT_MENTIONED');
    expect(q03!.mentionStatus).not.toBe('FAILED');
    expect(q03!.failureReason).toBeUndefined();
  });
});

describe('calcDashboardStats — 엣지 케이스', () => {
  it('빈 결과는 mentionRate null', () => {
    const stats = calcDashboardStats([], QUESTIONS.slice(0, 3));
    expect(stats.overall.mentionRate).toBeNull();
    expect(stats.overall.total).toBe(0);
  });

  it('meta 정보가 없어도 정상 동작', () => {
    const questions = [makeQuestion('Q01', 'BRAND')];
    const results = [makeResult('Q01', 'MENTIONED')];
    const stats = calcDashboardStats(results, questions);
    expect(stats.measuredAt).toBeUndefined();
    expect(stats.model).toBeUndefined();
    expect(stats.overall.mentionRate).toBe(100);
  });
});
