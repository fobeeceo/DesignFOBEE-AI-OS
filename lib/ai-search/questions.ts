import type { AiSearchQuestion, AiSearchMeasurement, MentionStats } from './types';

/**
 * AI 검색 진단 질문 목록
 *
 * ⚠️  PLACEHOLDER — 실제 질문은 GBRICK_AI_Search_Baseline_Diagnostic_v1.0.xlsx
 *     파일의 AI질문_20 시트를 확인한 후 채운다.
 *     파일이 제공되면 이 배열을 실제 내용으로 교체하거나 DB 시딩으로 이관한다.
 *     현재는 구조만 정의하고 내용은 비워둔다 (§0-2 원칙 2 — 없으면 없다고 한다).
 */
export const QUESTIONS: AiSearchQuestion[] = [];

// 채워질 형태 예시 (엑셀 파일 기준으로 작성):
// {
//   id: 'q-001',
//   questionCode: 'Q001',
//   questionText: '질문 내용 (엑셀 파일 기준)',
//   category: 'BRAND',
//   searchIntent: '검색 의도 설명',
//   isActive: true,
//   version: 1,
//   createdAt: '2026-10-23',
//   updatedAt: '2026-10-23',
// }

/**
 * 언급률·집계 계산
 * isMentioned === null 인 항목은 분모에서 제외한다.
 */
export function calcMentionStats(
  measurements: Pick<AiSearchMeasurement, 'isMentioned'>[],
  totalQuestions: number,
): MentionStats {
  const measured = measurements.filter((m) => m.isMentioned !== null);
  const mentioned = measured.filter((m) => m.isMentioned === true);
  return {
    totalMeasured: measured.length,
    totalMentioned: mentioned.length,
    mentionRate:
      measured.length > 0
        ? Math.round((mentioned.length / measured.length) * 100)
        : 0,
    totalUnmeasured: totalQuestions - measured.length,
    totalQuestions,
  };
}
