// AI Search Analyst — 자동 측정 전담 타입
// Phase 3: Gemini Google Search grounding 기반 자동 측정

/** 언급 감지 4상태 — FAILED를 NOT_MENTIONED로 처리하지 않는다 */
export type AnalystMentionStatus = 'MENTIONED' | 'NOT_MENTIONED' | 'UNMEASURED' | 'FAILED';

/** mentionDetector 반환값 */
export interface MentionDetectionResult {
  status: 'MENTIONED' | 'NOT_MENTIONED' | 'FAILED';
  /** MENTIONED일 때만: 언급된 텍스트 주변 스니펫 */
  evidence?: string;
  /** FAILED일 때만: 실패 사유 */
  failureReason?: string;
}

/** 질문 1개의 자동 측정 결과 */
export interface AnalystQuestionResult {
  questionId: string;
  questionCode: string;
  questionText: string;
  aiService: 'GEMINI' | 'CHATGPT';
  mentionStatus: AnalystMentionStatus;
  answerSummary: string;
  sourceUrls: string[];
  evidence?: string;
  failureReason?: string;
  measuredAt: string;
}

/** 전체 실행(20문항) 결과 */
export interface AnalystRunResult {
  runId: string;
  businessId: string;
  aiService: 'GEMINI' | 'CHATGPT';
  startedAt: string;
  finishedAt: string;
  totalQuestions: number;
  mentioned: number;
  notMentioned: number;
  failed: number;
  /** 측정 성공 질문 기준 언급률(%). 성공한 질문이 0이면 null */
  mentionRate: number | null;
  results: AnalystQuestionResult[];
}

/** 런 엔드포인트 요청 body */
export interface RunRequest {
  businessId: string;
  aiService: 'GEMINI';
  /** true면 API를 호출하지 않고 구조만 반환(빌드 확인용) */
  dryRun?: boolean;
  /** 실제 실행 시 최대 질문 수 제한. 기본값 20 */
  maxQuestions?: number;
  /** 특정 질문 코드만 실행. 미지정 시 전체(maxQuestions 범위). 예: ["Q03"] */
  questionCodes?: string[];
  /** 실행 트리거 출처. 기본값 MANUAL */
  triggeredBy?: 'MANUAL' | 'SCHEDULE';
}
