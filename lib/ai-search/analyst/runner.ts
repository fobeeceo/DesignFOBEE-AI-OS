import { QUESTIONS } from '../questions';
import { runGeminiQuestion } from './geminiAdapter';
import type { AnalystRunResult, AnalystQuestionResult } from './types';

const INTER_QUESTION_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function buildRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function calcMentionRate(mentioned: number, total: number, failed: number): number | null {
  const success = total - failed;
  return success > 0 ? Math.round((mentioned / success) * 100) : null;
}

/**
 * 지정된 질문 목록을 Gemini Google Search grounding으로 순차 실행한다.
 * - 질문 사이에 INTER_QUESTION_DELAY_MS 대기 (API 과부하 방지)
 * - 개별 질문 실패 시 FAILED로 기록하고 계속 진행
 *
 * @param businessId 측정 대상 사업체 ID
 * @param apiKey GEMINI_API_KEY — 절대 로그에 남기지 않는다
 * @param maxQuestions 실행 질문 수 상한 (기본값 20)
 * @param onProgress 질문 하나 완료마다 호출되는 콜백 (optional)
 * @param questionCodes 지정 시 해당 코드만 실행 (예: ["Q03"])
 */
export async function runAnalysis(
  businessId: string,
  apiKey: string,
  maxQuestions = 20,
  onProgress?: (done: number, total: number) => void,
  questionCodes?: string[],
): Promise<AnalystRunResult> {
  let activeQuestions = QUESTIONS.filter((q) => q.isActive);
  if (questionCodes && questionCodes.length > 0) {
    activeQuestions = activeQuestions.filter((q) => questionCodes.includes(q.questionCode));
  }
  activeQuestions = activeQuestions.slice(0, maxQuestions);
  const startedAt = new Date().toISOString();
  const runId = buildRunId();

  const results: AnalystQuestionResult[] = [];

  for (let i = 0; i < activeQuestions.length; i++) {
    const q = activeQuestions[i];
    const result = await runGeminiQuestion(q, apiKey);
    results.push(result);
    onProgress?.(i + 1, activeQuestions.length);

    if (i < activeQuestions.length - 1) {
      await sleep(INTER_QUESTION_DELAY_MS);
    }
  }

  const mentioned = results.filter((r) => r.mentionStatus === 'MENTIONED').length;
  const notMentioned = results.filter((r) => r.mentionStatus === 'NOT_MENTIONED').length;
  const failed = results.filter((r) => r.mentionStatus === 'FAILED').length;

  return {
    runId,
    businessId,
    aiService: 'GEMINI',
    startedAt,
    finishedAt: new Date().toISOString(),
    totalQuestions: activeQuestions.length,
    mentioned,
    notMentioned,
    failed,
    mentionRate: calcMentionRate(mentioned, activeQuestions.length, failed),
    results,
  };
}

/**
 * 드라이런 — API를 호출하지 않고 UNMEASURED 결과를 반환한다.
 * 빌드 확인 및 UI 구조 테스트용.
 */
export function dryRun(businessId: string, maxQuestions = 20): AnalystRunResult {
  const questions = QUESTIONS.filter((q) => q.isActive).slice(0, maxQuestions);
  const now = new Date().toISOString();
  const runId = buildRunId();

  const results: AnalystQuestionResult[] = questions.map((q) => ({
    questionId: q.id,
    questionCode: q.questionCode,
    questionText: q.questionText,
    aiService: 'GEMINI',
    mentionStatus: 'UNMEASURED',
    answerSummary: '[드라이런 — 실제 API 미호출]',
    sourceUrls: [],
    measuredAt: now,
  }));

  return {
    runId,
    businessId,
    aiService: 'GEMINI',
    startedAt: now,
    finishedAt: now,
    totalQuestions: questions.length,
    mentioned: 0,
    notMentioned: 0,
    failed: 0,
    mentionRate: null,
    results,
  };
}
