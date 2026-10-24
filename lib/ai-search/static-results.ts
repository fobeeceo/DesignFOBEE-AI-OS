/**
 * GBRICK Coffee — AI 검색 진단 정적 결과 (Phase 3 + 3.4 통합)
 * 원본: results-original.json + results-retest.json (스크래치패드)
 * DB 연결 전 대시보드 표시용. Supabase 구축 후 API로 대체한다.
 */

import type { AnalystMentionStatus, AnalystQuestionResult } from './analyst/types';
import type { AiSearchQuestion } from './types';
import { QUESTIONS } from './questions';

/** GBRICK Coffee 2026-10-24 통합 결과 (원본 + 재측정) */
const GBRICK_RAW: {
  questionCode: string;
  status: AnalystMentionStatus;
  evidence?: string;
  failureReason?: string;
  sourceUrls?: string[];
  measuredAt: string;
}[] = [
  { questionCode: 'Q01', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  { questionCode: 'Q02', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  {
    questionCode: 'Q03',
    status: 'NOT_MENTIONED',
    // Phase 6 실측(2026-10-24): 타임아웃 45초로 연장 후 정상 측정 완료
    // 33.1초, 8 sources, GBRICK Coffee 미언급 확인 (§0-2 원칙 1 — 사실이 먼저다)
    measuredAt: '2026-10-24',
  },
  { questionCode: 'Q04', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  { questionCode: 'Q05', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  {
    questionCode: 'Q06',
    status: 'MENTIONED',
    evidence: '지브릭커피 (G-BRICK COFFEE) · 마고정 3단지 상가 1층 (진관2로 90)',
    measuredAt: '2026-10-24',
  },
  { questionCode: 'Q07', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  { questionCode: 'Q08', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  { questionCode: 'Q09', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  { questionCode: 'Q10', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  { questionCode: 'Q11', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  { questionCode: 'Q12', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  { questionCode: 'Q13', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  { questionCode: 'Q14', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  { questionCode: 'Q15', status: 'NOT_MENTIONED', measuredAt: '2026-10-24' },
  {
    questionCode: 'Q16',
    status: 'MENTIONED',
    evidence: 'GBRICK Coffee(지브릭커피)는 공간 디자인 전문 기업인 (주)디자인포비가 공간 설계와 브랜딩을 맡아 10년 이상 운영해 온 로컬 프랜차이즈 카페 브랜드',
    measuredAt: '2026-10-24',
  },
  {
    questionCode: 'Q17',
    status: 'MENTIONED',
    evidence: '지브릭커피(G.BRICK COFFEE)의 대표 메뉴 및 인기 시그니처 메뉴는 다음과 같습니다.',
    measuredAt: '2026-10-24',
  },
  {
    questionCode: 'Q18',
    status: 'MENTIONED',
    evidence: '재측정(Phase 3.4)에서 MENTIONED 확인',
    measuredAt: '2026-10-24',
  },
  {
    questionCode: 'Q19',
    status: 'MENTIONED',
    evidence: '네, 지브릭커피(G.BRICK COFFEE)에서 팥빙수를 드실 수 있습니다. 직접 삶은 수제 팥을 활용한 우유눈꽃팥빙수',
    measuredAt: '2026-10-24',
  },
  {
    questionCode: 'Q20',
    status: 'MENTIONED',
    evidence: '지브릭커피(GBRICK Coffee)의 공식 웹사이트 및 영업시간 정보는 다음과 같습니다.',
    measuredAt: '2026-10-24',
  },
];

function buildResults(questions: AiSearchQuestion[]): AnalystQuestionResult[] {
  return questions.map((q) => {
    const raw = GBRICK_RAW.find((r) => r.questionCode === q.questionCode);
    if (!raw) {
      return {
        questionId: q.id,
        questionCode: q.questionCode,
        questionText: q.questionText,
        aiService: 'GEMINI' as const,
        mentionStatus: 'UNMEASURED' as const,
        answerSummary: '',
        sourceUrls: [],
        measuredAt: '',
      };
    }
    return {
      questionId: q.id,
      questionCode: q.questionCode,
      questionText: q.questionText,
      aiService: 'GEMINI' as const,
      mentionStatus: raw.status,
      answerSummary: raw.evidence ?? '',
      sourceUrls: raw.sourceUrls ?? [],
      evidence: raw.evidence,
      failureReason: raw.failureReason,
      measuredAt: raw.measuredAt,
    };
  });
}

/** GBRICK Coffee 진단 결과 — DB 연결 전 정적 데이터 */
export const GBRICK_STATIC_RESULTS: AnalystQuestionResult[] = buildResults(QUESTIONS);

/** 측정 메타 정보 */
export const GBRICK_STATIC_META = {
  businessId: 'gbrick-coffee',
  aiService: 'GEMINI' as const,
  model: 'gemini-3.8-flash',
  measuredAt: '2026-10-24',
  timeoutMs: 45_000,
  note: 'Phase 3 (2026-10-24) + Phase 3.4 재측정 + Phase 6 Q03 재측정(타임아웃 45s) 통합 결과',
} as const;
