/**
 * AI 검색 노출 개선 콘텐츠 초안 — 타입 정의
 * §0-2 원칙 2: 실제 자료가 없으면 AI가 생성하지 않는다.
 * 초안은 대표 검토·승인 후에만 외부 게시 가능 (service-workflow.md §8).
 * DB 연결 전 구조 정의 단계 — 실제 데이터는 승인 후 추가.
 */

export type ContentDraftStatus =
  | 'DRAFT'            // AI 초안 작성 완료 — 대표 검토 전
  | 'AWAITING_CEO'     // 대표 검토 대기 중
  | 'CEO_APPROVED'     // 대표 승인 완료 — 고객 확인 전
  | 'AWAITING_CUSTOMER' // 고객 확인 대기 중
  | 'APPROVED'         // 게시 승인 완료
  | 'PUBLISHED'        // 외부 게시 완료
  | 'REJECTED';        // 반려 (재작성 필요)

export type ContentPlatform =
  | 'NAVER_BLOG'
  | 'GOOGLE_BUSINESS'
  | 'INSTAGRAM'
  | 'THREADS'
  | 'FACEBOOK'
  | 'TIKTOK'
  | 'YOUTUBE_SHORTS';

export interface ContentDraft {
  id: string;
  businessId: string;
  /** 연결된 개선 과제 ID */
  improvementTaskId: string;
  /** 연결된 질문 코드 (개선 목표 질문) */
  targetQuestionCode: string;
  /** 게시 대상 플랫폼 */
  platform: ContentPlatform;
  /** 제목 */
  title: string;
  /** 본문 초안 */
  body: string;
  /** 사용된 키워드 목록 */
  keywords: string[];
  status: ContentDraftStatus;
  /** 대표 검토 의견 */
  ceoFeedback?: string;
  /** 고객 확인 의견 */
  customerFeedback?: string;
  /** 사실 확인 여부 — false면 게시 불가 */
  factChecked: boolean;
  /** 사실 확인 항목 */
  factCheckItems?: string[];
  createdAt: string;
  updatedAt: string;
}

export const CONTENT_PLATFORM_LABEL: Record<ContentPlatform, string> = {
  NAVER_BLOG: '네이버 블로그',
  GOOGLE_BUSINESS: 'Google Business Profile',
  INSTAGRAM: '인스타그램',
  THREADS: 'Threads',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
  YOUTUBE_SHORTS: 'YouTube Shorts',
};

export const CONTENT_DRAFT_STATUS_LABEL: Record<ContentDraftStatus, string> = {
  DRAFT: 'AI 초안',
  AWAITING_CEO: '대표 검토 대기',
  CEO_APPROVED: '대표 승인',
  AWAITING_CUSTOMER: '고객 확인 대기',
  APPROVED: '게시 승인',
  PUBLISHED: '게시 완료',
  REJECTED: '반려',
};

export const CONTENT_DRAFT_STATUS_COLOR: Record<ContentDraftStatus, string> = {
  DRAFT: 'text-muted-foreground',
  AWAITING_CEO: 'text-amber-600',
  CEO_APPROVED: 'text-blue-600',
  AWAITING_CUSTOMER: 'text-amber-600',
  APPROVED: 'text-green-600',
  PUBLISHED: 'text-green-700',
  REJECTED: 'text-red-600',
};

/**
 * 게시 가능 여부 — 승인 + 사실 확인 둘 다 충족해야 한다.
 * 어떤 경우에도 factChecked = false면 게시 불가 (§0-2 원칙 2·3).
 */
export function canPublish(draft: ContentDraft): boolean {
  return draft.status === 'APPROVED' && draft.factChecked;
}
