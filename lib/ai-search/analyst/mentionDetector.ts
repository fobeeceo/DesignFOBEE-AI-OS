import type { MentionDetectionResult } from './types';

/**
 * 브랜드 언급 감지 — 측정 절차서(docs/ai-search/measurement-procedure-v1.md §5) 기준
 * "GBRICK Coffee" 또는 "지브릭커피"가 답변 본문에 명시적으로 등장하면 MENTIONED.
 */

const BRAND_KEYWORDS = ['GBRICK Coffee', '지브릭커피'] as const;

const SNIPPET_RADIUS = 80;

/**
 * answerText에서 브랜드 키워드를 검색한다.
 * - 한국어 "지브릭커피"는 정확 일치
 * - 영문 "GBRICK Coffee"는 대소문자 무시
 */
export function detectMention(answerText: string): MentionDetectionResult {
  if (!answerText || !answerText.trim()) {
    return { status: 'FAILED', failureReason: '답변 텍스트가 비어 있습니다.' };
  }

  const lowerText = answerText.toLowerCase();

  for (const keyword of BRAND_KEYWORDS) {
    const lowerKeyword = keyword.toLowerCase();
    const idx = lowerText.indexOf(lowerKeyword);
    if (idx !== -1) {
      const start = Math.max(0, idx - SNIPPET_RADIUS);
      const end = Math.min(answerText.length, idx + keyword.length + SNIPPET_RADIUS);
      const evidence = answerText.slice(start, end).replace(/\s+/g, ' ').trim();
      return { status: 'MENTIONED', evidence };
    }
  }

  return { status: 'NOT_MENTIONED' };
}

/**
 * answerText에서 최초 언급 위치(1-based)를 반환한다.
 * 언급이 없으면 null.
 */
export function findFirstMentionIndex(answerText: string): number | null {
  const lower = answerText.toLowerCase();
  const positions = BRAND_KEYWORDS.map((k) => lower.indexOf(k.toLowerCase())).filter((i) => i !== -1);
  if (!positions.length) return null;
  return Math.min(...positions) + 1;
}
