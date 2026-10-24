// D.8 — AI 검색 노출 진단 자동화 설계
// 스케줄러 활성화는 대표 승인 후 실행한다 (§0-2 원칙 6).
// 이 파일은 자동화 흐름의 타입 정의와 dry-run 구조만 포함한다.

/**
 * 자동화 파이프라인 단계
 *
 * 1. TRIGGER        — 스케줄 또는 수동 실행으로 시작
 * 2. MEASURE        — Gemini API 호출, 20문항 측정 (타임아웃 45초)
 * 3. PERSIST        — 결과를 Supabase에 저장 (승인 후)
 * 4. COMPARE        — 이전 측정과 비교
 * 5. DRAFT_CONTENT  — 미언급 질문에 대한 콘텐츠 초안 AI 생성
 * 6. NOTIFY_CEO     — 대표에게 초안 검토 요청 알림
 * 7. AWAIT_APPROVAL — 대표 승인 대기 (자동 게시 없음)
 * 8. REPORT         — 월간 리포트 생성
 */
export type AutomationStep =
  | 'TRIGGER'
  | 'MEASURE'
  | 'PERSIST'
  | 'COMPARE'
  | 'DRAFT_CONTENT'
  | 'NOTIFY_CEO'
  | 'AWAIT_APPROVAL'
  | 'REPORT';

export type AutomationRunStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'AWAITING_CEO';

export interface AutomationRun {
  runId: string;
  businessId: string;
  triggeredAt: string;
  triggeredBy: 'SCHEDULE' | 'MANUAL';
  status: AutomationRunStatus;
  currentStep: AutomationStep;
  completedSteps: AutomationStep[];
  failedStep?: AutomationStep;
  failureReason?: string;
  /** 이 실행에서 생성된 측정 회차 ID */
  measurementRoundId?: string;
  /** 이 실행에서 생성된 콘텐츠 초안 ID 목록 */
  draftIds: string[];
}

/**
 * 자동화 스케줄 설정
 * 실제 스케줄러 등록은 대표 승인 후 별도 작업으로 수행.
 */
export interface AutomationScheduleConfig {
  businessId: string;
  /** cron 표현식 — 기본: 매월 1일 오전 9시 KST */
  cronExpression: string;
  /** 타임존 */
  timezone: string;
  enabled: boolean;
  /** 활성화 승인 일시 */
  enabledAt?: string;
  enabledBy?: string;
}

/** 자동화 승인 없이 활성화 금지 (§0-2 원칙 6) */
export function isScheduleActive(config: AutomationScheduleConfig): boolean {
  return config.enabled && config.enabledAt !== undefined;
}

/**
 * dry-run: 실제 API 호출 없이 자동화 흐름을 시뮬레이션한다.
 * 반환값은 각 단계의 예상 소요 시간(초)과 사전 조건 목록.
 */
export function dryRunAutomation(businessId: string): AutomationDryRunResult {
  return {
    businessId,
    steps: [
      {
        step: 'TRIGGER',
        estimatedSeconds: 0,
        prerequisites: [],
        notes: '수동 또는 cron 스케줄 실행',
      },
      {
        step: 'MEASURE',
        estimatedSeconds: 600,
        prerequisites: ['GEMINI_API_KEY 환경변수 설정', '20문항 활성 상태'],
        notes: '타임아웃 45초 × 20문항 = 최대 15분. 실패 항목은 FAILED로 기록.',
      },
      {
        step: 'PERSIST',
        prerequisites: ['Supabase 연결 승인 (별도 대표 승인 필요)', 'DB 스키마 마이그레이션 완료'],
        estimatedSeconds: 5,
        notes: '현재 차단: Supabase 재개 미승인 상태',
      },
      {
        step: 'COMPARE',
        estimatedSeconds: 1,
        prerequisites: ['이전 측정 데이터 존재 (PERSIST 완료 후)'],
        notes: '이전 측정이 없으면 기준선만 기록',
      },
      {
        step: 'DRAFT_CONTENT',
        estimatedSeconds: 120,
        prerequisites: ['NOT_MENTIONED 질문 목록', '개선 과제 데이터'],
        notes: 'Gemini API 호출로 초안 생성. 사실 미확인 상태로 생성됨.',
      },
      {
        step: 'NOTIFY_CEO',
        estimatedSeconds: 1,
        prerequisites: ['알림 채널 설정 (이메일/Slack)'],
        notes: '초안 검토 요청 알림 발송',
      },
      {
        step: 'AWAIT_APPROVAL',
        estimatedSeconds: 0,
        prerequisites: ['대표 검토 완료'],
        notes: '자동 진행 없음. 대표가 직접 승인해야 APPROVED 상태로 전환.',
      },
      {
        step: 'REPORT',
        estimatedSeconds: 10,
        prerequisites: ['해당 월 측정 완료', 'AWAIT_APPROVAL 완료'],
        notes: '월간 리포트 생성. 대표 승인 전 대외 공유 불가.',
      },
    ],
  };
}

export interface AutomationDryRunResult {
  businessId: string;
  steps: Array<{
    step: AutomationStep;
    estimatedSeconds: number;
    prerequisites: string[];
    notes: string;
  }>;
}
