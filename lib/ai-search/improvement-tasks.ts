/**
 * AI 검색 노출 개선 과제 — 타입 정의 및 GBRICK Coffee 정적 과제
 * DB 연결 전 정적 데이터. Supabase 구축 후 API로 대체한다.
 */

export type ImprovementStatus =
  | 'PENDING'       // 대기 중 (분석 완료, 실행 전)
  | 'PLANNING'      // 콘텐츠 초안 작성 중
  | 'AWAITING_CEO'  // 대표 검토 대기
  | 'AWAITING_CUSTOMER' // 고객 승인 대기
  | 'IN_PROGRESS'   // 실행 중
  | 'DONE'          // 실행 완료 (재측정 전)
  | 'VERIFIED';     // 재측정으로 효과 확인

export type ImprovementAssignee = 'AI' | 'CEO' | 'CUSTOMER';

export interface ImprovementTask {
  id: string;
  businessId: string;
  /** 연결된 질문 코드 (Q01~Q20). 여러 질문에 걸치는 경우 첫 번째 */
  questionCode: string;
  /** 연결된 추가 질문 코드들 */
  relatedQuestionCodes?: string[];
  /** 발견된 문제 */
  problem: string;
  /** 개선 가설 (실행 전 — 검증 필요) */
  hypothesis: string;
  /** 실행할 콘텐츠 또는 웹사이트 작업 */
  contentPlan: string;
  /** 게시 대상 플랫폼 */
  targetPlatform: string;
  status: ImprovementStatus;
  assignee: ImprovementAssignee;
  /** 고객(점주) 승인 여부 — null: 대기 중 */
  customerApproved: boolean | null;
  executedAt?: string;
  verificationResult?: 'IMPROVED' | 'NO_CHANGE' | 'REGRESSION' | 'INSUFFICIENT_DATA';
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** GBRICK Coffee 개선 과제 (기준선 분석 기반 — 2026-10-24) */
export const GBRICK_IMPROVEMENT_TASKS: ImprovementTask[] = [
  {
    id: 'gbrick-imp-01',
    businessId: 'gbrick-coffee',
    questionCode: 'Q01',
    relatedQuestionCodes: ['Q02', 'Q05', 'Q15'],
    problem:
      '은평뉴타운 카페 일반 추천 질문에서 GBRICK Coffee가 언급되지 않는다. ' +
      'AI가 브랜드는 알고 있지만 일반 추천 맥락에서 꺼내지 않는다.',
    hypothesis:
      '"은평뉴타운 카페 추천" 키워드를 포함한 블로그·리뷰 콘텐츠가 늘어나면 ' +
      'AI 응답에서 언급 빈도가 높아질 것이다. (검증 필요)',
    contentPlan:
      '"은평뉴타운 카페 추천 TOP5" 형식의 블로그 포스트 작성. ' +
      'GBRICK Coffee의 위치·특징·분위기를 구체적으로 설명.',
    targetPlatform: '네이버 블로그 · Google Business Profile',
    status: 'PENDING',
    assignee: 'AI',
    customerApproved: null,
    createdAt: '2026-10-24',
    updatedAt: '2026-10-24',
  },
  {
    id: 'gbrick-imp-02',
    businessId: 'gbrick-coffee',
    questionCode: 'Q13',
    relatedQuestionCodes: ['Q11', 'Q12', 'Q14'],
    problem:
      '공간·분위기 관련 질문(유리 인테리어, 대화하기 편한, 모임 장소, 휴식 카페) ' +
      '4개 모두 미노출. 디자인포비 설계 특화 공간이라는 핵심 강점이 AI에 전달되지 않는다.',
    hypothesis:
      '"유리 인테리어" "조용한 공간" "대화하기 좋은" 키워드를 포함한 콘텐츠를 ' +
      '블로그·SNS에 게시하면 분위기 관련 질문 노출률이 개선될 것이다. (검증 필요)',
    contentPlan:
      'GBRICK Coffee 공간 특징 소개 콘텐츠: ' +
      '유리 인테리어 사진 + "조용히 대화하기 좋은", "소규모 모임 가능" 설명. ' +
      '인스타그램 릴스 + 블로그 포스트 세트.',
    targetPlatform: '인스타그램 · 네이버 블로그 · Google Business Profile',
    status: 'PLANNING',
    assignee: 'AI',
    customerApproved: null,
    createdAt: '2026-10-24',
    updatedAt: '2026-10-24',
  },
  {
    id: 'gbrick-imp-03',
    businessId: 'gbrick-coffee',
    questionCode: 'Q07',
    relatedQuestionCodes: ['Q10'],
    problem:
      '팥빙수 메뉴 보유가 확인되었지만(Q19 MENTIONED) ' +
      '"은평구 팥빙수 카페" 일반 검색(Q07·Q10)에서는 언급되지 않는다.',
    hypothesis:
      '"은평구 팥빙수" "은평뉴타운 빙수" 키워드를 포함한 콘텐츠를 게시하면 ' +
      '관련 일반 검색 노출이 생길 것이다. (검증 필요)',
    contentPlan:
      '"지브릭커피 우유눈꽃팥빙수" 시그니처 메뉴 소개 콘텐츠. ' +
      '"은평뉴타운에서 팥빙수 먹을 수 있는 카페" 주제 블로그 포스트.',
    targetPlatform: '네이버 블로그 · 인스타그램',
    status: 'PENDING',
    assignee: 'AI',
    customerApproved: null,
    createdAt: '2026-10-24',
    updatedAt: '2026-10-24',
  },
  {
    id: 'gbrick-imp-04',
    businessId: 'gbrick-coffee',
    questionCode: 'Q03',
    relatedQuestionCodes: [],
    problem:
      'Q03 "은평구 진관동 조용한 카페" 질문이 30초 타임아웃으로 2회 모두 FAILED. ' +
      '측정 결과 없음. 타임아웃 원인 불명확.',
    hypothesis:
      '타임아웃 설정을 45~60초로 늘리거나 질문을 단순화하면 측정 가능할 것이다. ' +
      '(기술적 해결 — 콘텐츠 개선 전 선행 필요)',
    contentPlan: '타임아웃 설정 변경 or 질문 단순화 (예: "은평구 진관동 카페 추천해 줘") 후 재측정',
    targetPlatform: 'AI 측정 시스템 (내부)',
    status: 'PENDING',
    assignee: 'AI',
    customerApproved: null,
    createdAt: '2026-10-24',
    updatedAt: '2026-10-24',
  },
];

/** 상태 표시 텍스트 */
export const IMPROVEMENT_STATUS_LABEL: Record<ImprovementStatus, string> = {
  PENDING: '대기 중',
  PLANNING: '초안 작성 중',
  AWAITING_CEO: '대표 검토 대기',
  AWAITING_CUSTOMER: '고객 승인 대기',
  IN_PROGRESS: '실행 중',
  DONE: '실행 완료',
  VERIFIED: '효과 확인',
};

export const IMPROVEMENT_STATUS_COLOR: Record<ImprovementStatus, string> = {
  PENDING: 'text-muted-foreground',
  PLANNING: 'text-blue-600',
  AWAITING_CEO: 'text-amber-600',
  AWAITING_CUSTOMER: 'text-amber-600',
  IN_PROGRESS: 'text-primary',
  DONE: 'text-green-600',
  VERIFIED: 'text-green-700',
};
