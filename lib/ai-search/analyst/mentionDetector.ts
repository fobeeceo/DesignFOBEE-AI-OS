import type { MentionDetectionResult } from './types';

/**
 * 브랜드 언급 감지 — 측정 절차서(docs/ai-search/measurement-procedure-v1.md §5) 기준
 * 아래 키워드 중 하나라도 답변 본문에 등장하면 MENTIONED.
 *
 * 실측에서 발견된 공식 브랜드명 변형 (2026-10-25 run_1792927774261_gbrick):
 *   영문: "GBRICK Coffee" (공식), "G.BRICK COFFEE" (점·대문자 표기)
 *   한글: "지브릭커피" (공식), "지브릭 커피" (공백 있는 표기)
 * 영문 키워드는 대소문자 무시. 한글 키워드는 정확 일치(공백 포함).
 */
const BRAND_KEYWORDS = [
  'GBRICK Coffee',   // 공식 영문 표기
  'G.BRICK Coffee',  // 점 포함 영문 표기 (대소문자 무시로 G.BRICK COFFEE 포함)
  '지브릭커피',        // 공식 한글 표기
  '지브릭 커피',       // 공백 있는 한글 변형 (AI 응답에서 실측 확인)
] as const;

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
