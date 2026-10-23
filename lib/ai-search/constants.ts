import type { AiService, AiSearchBusiness, FactCheckStatus, QuestionCategory } from './types';

export const AI_SERVICES: Record<AiService, string> = {
  CHATGPT: 'ChatGPT',
  GEMINI: 'Google Gemini',
  CLAUDE: 'Claude',
  PERPLEXITY: 'Perplexity',
  OTHER: '기타',
};

export const QUESTION_CATEGORIES: Record<QuestionCategory, string> = {
  BRAND: '브랜드 인지',
  LOCATION: '위치·접근성',
  MENU: '메뉴·음료',
  PRICE: '가격·비용',
  ATMOSPHERE: '분위기·공간',
  FRANCHISE: '가맹·창업',
  REVIEW: '후기·평점',
  COMPARISON: '경쟁 비교',
  RECOMMEND: '추천 요청',
  OTHER: '기타',
};

export const FACT_CHECK_STATUS_LABEL: Record<FactCheckStatus, string> = {
  PENDING: '확인 대기',
  CONFIRMED: '확인 완료',
  NEEDS_UPDATE: '업데이트 필요',
};

/**
 * DB 연결 전 임시 사업체 목록 (SSOT: lib/company/profile.ts 참조)
 * DB 구현 후 GET /api/ai-search/businesses 로 대체한다.
 */
export const DEMO_BUSINESSES: Pick<
  AiSearchBusiness,
  'id' | 'name' | 'businessType' | 'brand' | 'factCheckStatus' | 'isActive' | 'createdAt' | 'updatedAt'
>[] = [
  {
    id: 'gbrick-coffee',
    name: 'GBRICK Coffee 지브릭커피',
    businessType: '카페',
    brand: 'GBRICK Coffee',
    factCheckStatus: 'PENDING',
    isActive: true,
    createdAt: '2026-10-23',
    updatedAt: '2026-10-23',
  },
  {
    id: 'designfobee',
    name: '디자인포비',
    businessType: '공간디자인',
    brand: 'DesignFOBEE',
    factCheckStatus: 'PENDING',
    isActive: true,
    createdAt: '2026-10-23',
    updatedAt: '2026-10-23',
  },
];
