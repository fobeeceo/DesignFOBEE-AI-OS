// AI 검색 노출 진단·개선 시스템 — 공유 타입 정의
// DB 구현 시 Prisma 생성 타입으로 교체 가능한 구조

export type AiService = 'CHATGPT' | 'GEMINI' | 'CLAUDE' | 'PERPLEXITY' | 'OTHER';

export type FactCheckStatus = 'PENDING' | 'CONFIRMED' | 'NEEDS_UPDATE';

/**
 * isMentioned 3상태 — 절대 혼동하지 않는다:
 *   null  = 미측정 (집계 분모에서 제외)
 *   true  = 언급됨 (분자 + 분모)
 *   false = 미언급 (분모만)
 */
export type MeasurementMentioned = true | false | null;

export type QuestionCategory =
  | 'BRAND'
  | 'LOCATION'
  | 'MENU'
  | 'PRICE'
  | 'ATMOSPHERE'
  | 'FRANCHISE'
  | 'REVIEW'
  | 'COMPARISON'
  | 'RECOMMEND'
  | 'OTHER';

export interface AiSearchBusiness {
  id: string;
  name: string;
  businessType: string;
  brand: string;
  address?: string;
  phone?: string;
  businessHours?: string;
  websiteUrl?: string;
  naverPlaceUrl?: string;
  googlePlaceUrl?: string;
  instagramUrl?: string;
  menuOrServices?: string;
  priceRange?: string;
  factCheckStatus: FactCheckStatus;
  factCheckedAt?: string;
  factCheckedBy?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiSearchQuestion {
  id: string;
  questionCode: string;
  questionText: string;
  category: QuestionCategory;
  region?: string;
  searchIntent: string;
  isActive: boolean;
  version: number;
  versionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiSearchMeasurement {
  id: string;
  businessId: string;
  questionId: string;
  measuredAt: string;
  aiService: AiService;
  aiServiceVersion?: string;
  answerSummary?: string;
  answerFull?: string;
  isMentioned: MeasurementMentioned;
  isInRecommendedList?: boolean;
  mentionPosition?: number;
  sourceUrls: string[];
  sourceCount: number;
  isManualEntry: boolean;
  measurerEmail?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MentionStats {
  totalMeasured: number;
  totalMentioned: number;
  mentionRate: number;
  totalUnmeasured: number;
  totalQuestions: number;
}
