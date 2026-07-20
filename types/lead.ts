export type LeadStatus = "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  source: string;
  status: LeadStatus;
  profileId?: string | null;
  designImageId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  source: string;
  /** STEP 2: 로그인 사용자가 신청한 경우 프로필과 연결 (있으면 서버에서 자동 첨부) */
  profileId?: string;
  /** STEP 8: AI 디자인 스튜디오에서 신청한 경우, 첨부할 결과 이미지 */
  designImageId?: string;
}

export interface CreateLeadResponse {
  success: boolean;
  leadId?: string;
  error?: string;
}

/** STEP 9: CRM 상담 메모/통화 이력 */
export interface LeadNote {
  id: string;
  leadId: string;
  authorId?: string | null;
  authorName?: string | null;
  content: string;
  createdAt: string;
}

/** STEP 9: 관리자 리드 목록 화면용 요약 항목 */
export interface LeadListItem extends Lead {
  hasDesignImage: boolean;
}

export interface LeadListResult {
  leads: LeadListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** STEP 9: 관리자 리드 상세 화면용 — 첨부된 AI 디자인 결과 + 상담 메모 이력 포함 */
export interface LeadDetail extends Lead {
  designImageSummary?: {
    id: string;
    url: string;
    roomType: string;
    style: string;
    description?: string | null;
    estimate?: {
      areaSqm: number;
      pricePerSqm: number;
      minPrice: number;
      maxPrice: number;
    } | null;
  } | null;
  notes: LeadNote[];
}

export interface UpdateLeadStatusInput {
  status: LeadStatus;
}

export interface AddLeadNoteInput {
  content: string;
}
