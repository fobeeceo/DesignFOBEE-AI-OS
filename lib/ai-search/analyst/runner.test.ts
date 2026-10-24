import { describe, expect, it, vi } from 'vitest';
import { dryRun } from './runner';
import { QUESTIONS } from '../questions';

// runAnalysis는 실제 API 호출이므로 이 테스트에서는 다루지 않는다.
// geminiAdapter.ts를 vi.mock()으로 교체한 통합 테스트는 별도로 작성한다.

describe('dryRun', () => {
  it('20문항 전체를 UNMEASURED로 반환한다', () => {
    const result = dryRun('gbrick-coffee', 20);
    expect(result.totalQuestions).toBe(20);
    expect(result.results.every((r) => r.mentionStatus === 'UNMEASURED')).toBe(true);
    expect(result.mentioned).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.mentionRate).toBeNull();
  });

  it('maxQuestions로 실행 수를 제한한다', () => {
    const result = dryRun('gbrick-coffee', 3);
    expect(result.totalQuestions).toBe(3);
    expect(result.results).toHaveLength(3);
  });

  it('businessId가 결과에 포함된다', () => {
    const result = dryRun('designfobee', 5);
    expect(result.businessId).toBe('designfobee');
    expect(result.aiService).toBe('GEMINI');
  });

  it('runId는 비어 있지 않다', () => {
    const result = dryRun('gbrick-coffee', 1);
    expect(result.runId).toBeTruthy();
    expect(result.runId).toMatch(/^run_/);
  });

  it('UNMEASURED는 NOT_MENTIONED가 아니다', () => {
    const result = dryRun('gbrick-coffee', 5);
    for (const r of result.results) {
      expect(r.mentionStatus).not.toBe('NOT_MENTIONED');
      expect(r.mentionStatus).not.toBe('FAILED');
      expect(r.mentionStatus).toBe('UNMEASURED');
    }
  });

  it('각 결과에 questionCode와 questionText가 있다', () => {
    const result = dryRun('gbrick-coffee', 5);
    for (const r of result.results) {
      expect(r.questionCode).toMatch(/^Q\d{2}$/);
      expect(r.questionText.length).toBeGreaterThan(0);
    }
  });
});

describe('QUESTIONS 연결 확인', () => {
  it('활성 질문 20개', () => {
    const active = QUESTIONS.filter((q) => q.isActive);
    expect(active).toHaveLength(20);
  });
});
