import { describe, expect, it } from 'vitest';
import { GBRICK_STATIC_RESULTS, GBRICK_STATIC_META } from './static-results';
import { QUESTIONS } from './questions';

describe('GBRICK_STATIC_RESULTS — 데이터 무결성', () => {
  it('20개 질문 모두 결과가 있다', () => {
    const activeCount = QUESTIONS.filter((q) => q.isActive).length;
    expect(GBRICK_STATIC_RESULTS).toHaveLength(activeCount);
    expect(activeCount).toBe(20);
  });

  it('모든 결과에 questionCode가 있다', () => {
    for (const r of GBRICK_STATIC_RESULTS) {
      expect(r.questionCode).toMatch(/^Q\d{2}$/);
    }
  });

  it('MENTIONED 6건', () => {
    const mentioned = GBRICK_STATIC_RESULTS.filter((r) => r.mentionStatus === 'MENTIONED');
    expect(mentioned).toHaveLength(6);
  });

  // Phase 6 (2026-10-24): Q03 타임아웃 45s 연장 후 재측정 → NOT_MENTIONED 확인 (§0-2 원칙 1)
  it('NOT_MENTIONED 14건', () => {
    const notMentioned = GBRICK_STATIC_RESULTS.filter((r) => r.mentionStatus === 'NOT_MENTIONED');
    expect(notMentioned).toHaveLength(14);
  });

  it('FAILED 0건 — 전 문항 측정 완료', () => {
    const failed = GBRICK_STATIC_RESULTS.filter((r) => r.mentionStatus === 'FAILED');
    expect(failed).toHaveLength(0);
  });

  it('Q03은 NOT_MENTIONED — Phase 6 재측정 결과 (FAILED 아님)', () => {
    const q03 = GBRICK_STATIC_RESULTS.find((r) => r.questionCode === 'Q03');
    expect(q03).toBeDefined();
    expect(q03!.mentionStatus).toBe('NOT_MENTIONED');
    expect(q03!.mentionStatus).not.toBe('FAILED');
  });

  it('MENTIONED 결과는 evidence가 있다', () => {
    const mentioned = GBRICK_STATIC_RESULTS.filter((r) => r.mentionStatus === 'MENTIONED');
    for (const r of mentioned) {
      expect(r.evidence).toBeTruthy();
    }
  });

  it('UNMEASURED 상태인 결과 없음 (전체 측정 완료)', () => {
    const unmeasured = GBRICK_STATIC_RESULTS.filter((r) => r.mentionStatus === 'UNMEASURED');
    expect(unmeasured).toHaveLength(0);
  });

  it('measuredAt이 2026-10-24로 통일', () => {
    for (const r of GBRICK_STATIC_RESULTS) {
      expect(r.measuredAt).toBe('2026-10-24');
    }
  });
});

describe('GBRICK_STATIC_META — 측정 메타 정보', () => {
  it('businessId, model, measuredAt이 있다', () => {
    expect(GBRICK_STATIC_META.businessId).toBe('gbrick-coffee');
    expect(GBRICK_STATIC_META.model).toBeTruthy();
    expect(GBRICK_STATIC_META.measuredAt).toBe('2026-10-24');
  });

  // Phase 6 (2026-10-24): Q03 타임아웃 30s → 45s 연장 (대표 승인)
  it('타임아웃 45초로 설정', () => {
    expect(GBRICK_STATIC_META.timeoutMs).toBe(45_000);
  });

  it('모델이 gemini-3.8-flash (gemini-2.0-flash 아님)', () => {
    expect(GBRICK_STATIC_META.model).toBe('gemini-3.8-flash');
    expect(GBRICK_STATIC_META.model).not.toContain('2.0-flash');
  });
});
