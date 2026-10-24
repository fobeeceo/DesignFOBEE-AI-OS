import { GoogleGenAI } from '@google/genai';
import { detectMention } from './mentionDetector';
import type { AnalystQuestionResult } from './types';
import type { AiSearchQuestion } from '../types';

// gemini-2.0-flash: Google Search grounding 지원 모델
const MODEL = 'gemini-2.0-flash';
const TIMEOUT_MS = 30_000;

interface RawGeminiResult {
  answerText: string;
  sourceUrls: string[];
}

/**
 * SDK 오류 메시지에서 잠재적 비밀값 패턴을 제거한다.
 * Gemini API 키는 "AIza" 로 시작하는 39자 문자열이다.
 */
function sanitizeErrorMessage(msg: string): string {
  return msg.replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED]');
}

/**
 * 질문 1개를 Gemini Google Search grounding으로 조회한다.
 * ⚠️ apiKey를 로그에 출력하지 않는다.
 * ⚠️ 30초 타임아웃 — AbortController로 실제 네트워크 요청 취소.
 */
async function queryGeminiWithSearch(
  question: string,
  apiKey: string,
): Promise<RawGeminiResult> {
  const ai = new GoogleGenAI({ apiKey });

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(new Error(`Gemini API 응답 시간 초과 (${TIMEOUT_MS}ms)`)),
    TIMEOUT_MS,
  );

  let res;
  try {
    res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: question }] }],
      config: {
        tools: [{ googleSearch: {} }],
        abortSignal: controller.signal,
      },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (controller.signal.aborted) {
      throw new Error(`Gemini API 응답 시간 초과 (${TIMEOUT_MS}ms)`);
    }
    throw err;
  }
  clearTimeout(timeoutId);

  const answerText =
    res.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim() ?? '';

  const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sourceUrls = chunks
    .map((c) => c.web?.uri)
    .filter((u): u is string => Boolean(u));

  return { answerText, sourceUrls };
}

/** 답변을 요약 (앞 200자) */
function summarize(text: string): string {
  return text.length > 200 ? text.slice(0, 200) + '…' : text;
}

/**
 * 질문 1개를 실행하고 AnalystQuestionResult를 반환한다.
 * API 호출이 실패해도 FAILED 상태로 결과를 반환하고 예외를 던지지 않는다.
 */
export async function runGeminiQuestion(
  question: AiSearchQuestion,
  apiKey: string,
): Promise<AnalystQuestionResult> {
  const measuredAt = new Date().toISOString();

  try {
    const { answerText, sourceUrls } = await queryGeminiWithSearch(
      question.questionText,
      apiKey,
    );

    if (!answerText) {
      return {
        questionId: question.id,
        questionCode: question.questionCode,
        questionText: question.questionText,
        aiService: 'GEMINI',
        mentionStatus: 'FAILED',
        answerSummary: '',
        sourceUrls,
        failureReason: 'API가 빈 응답을 반환했습니다.',
        measuredAt,
      };
    }

    const detection = detectMention(answerText);

    return {
      questionId: question.id,
      questionCode: question.questionCode,
      questionText: question.questionText,
      aiService: 'GEMINI',
      mentionStatus: detection.status,
      answerSummary: summarize(answerText),
      sourceUrls,
      evidence: detection.evidence,
      failureReason: detection.failureReason,
      measuredAt,
    };
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    const reason = sanitizeErrorMessage(raw);
    return {
      questionId: question.id,
      questionCode: question.questionCode,
      questionText: question.questionText,
      aiService: 'GEMINI',
      mentionStatus: 'FAILED',
      answerSummary: '',
      sourceUrls: [],
      failureReason: `API 호출 실패: ${reason}`,
      measuredAt,
    };
  }
}
