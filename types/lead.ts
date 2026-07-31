export type LeadStatus = "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";

/** STEP 11: AI가 자동 계산하는 상담 응대 우선순위. */
export type LeadPriority = "HIGH" | "MEDIUM" | "LOW";

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
  /** STEP 10: /franchise 가맹상담 전용 필드 — 다른 source의 리드는 전부 null. */
  preferredRegion?: string | null;
  plannedTiming?: string | null;
  expectedInvestment?: string | null;
  currentOccupation?: string | null;
  hasStorefront?: boolean | null;
  consultationPurpose?: string | null;
  privacyConsent: boolean;
  /** STEP 11 (Franchise AI v2.0): 저장 시 서버가 자동 계산하는 값 + 관리자 기록 영역. */
  referenceNo?: string | null;
  fitScore?: number | null;
  priority?: LeadPriority | null;
  tags?: string[];
  recommendedCases?: string[];
  aiSummary?: string | null;
  nextAction?: string | null;
  aiMemo?: string | null;
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
  /** STEP 10: /franchise 가맹상담 전용 필드 (franchiseLeadSchema를 통해서만 채워짐) */
  preferredRegion?: string;
  plannedTiming?: string;
  expectedInvestment?: string;
  currentOccupation?: string;
  hasStorefront?: boolean;
  consultationPurpose?: string;
  privacyConsent?: boolean;
}

/** 신청 완료 화면에 보여줄 AI 진단 결과 + 추천 성공사례. */
export interface LeadDiagnosisResult {
  referenceNo?: string | null;
  fitScore: number;
  stars: number;
  headline: string;
  description: string;
  recommendedCases: {
    code: string;
    title: string;
    location: string;
    summary: string;
    image: string;
  }[];
}

export interface CreateLeadResponse {
  success: boolean;
  leadId?: string;
  /** STEP 11: 가맹상담(source=franchise_page)일 때만 채워진다. */
  diagnosis?: LeadDiagnosisResult;
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
