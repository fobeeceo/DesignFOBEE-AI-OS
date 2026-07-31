/**
 * GBRICK Franchise AI v2.0 — 상담 리드 자동 분석 엔진.
 *
 * 현재는 규칙 기반(Mock) 계산이지만, 입출력 타입을 고정해두었으므로 추후 실제 AI 모델
 * 호출로 교체할 때 이 파일의 함수 본문만 바꾸면 된다(호출부 수정 불필요).
 * 순수 함수로만 구성해 DB·네트워크 없이 테스트 가능하게 유지한다.
 *
 * ⚠️ 적합도 점수는 상담 우선순위를 정하기 위한 내부 참고 지표다.
 *    실제 가맹 승인·거절을 결정하는 심사 결과가 아니며, 화면 문구도 그렇게 표기한다.
 */

export type LeadPriority = "HIGH" | "MEDIUM" | "LOW";

/** 분석에 사용하는 입력 — 상담 폼 필드와 1:1 대응한다. */
export interface LeadSignals {
  consultationPurpose?: string | null;
  preferredRegion?: string | null;
  plannedTiming?: string | null;
  expectedInvestment?: string | null;
  currentOccupation?: string | null;
  hasStorefront?: boolean | null;
  message?: string | null;
}

export interface FitDiagnosis {
  score: number;
  /** 5점 만점 별점 — 화면에 ★로 표시한다. */
  stars: number;
  headline: string;
  description: string;
}

/** 투자 여력 점수(0~30). 금액이 클수록 초기 자금 준비도가 높다고 본다. */
const INVESTMENT_SCORE: Record<string, number> = {
  "2억 원 이상": 30,
  "1.5억 ~ 2억 원": 26,
  "1억 ~ 1.5억 원": 20,
  "1억 원 미만": 12,
  "상담 후 결정": 8,
};

/** 창업 시기 점수(0~30). 가까울수록 실행 의지가 구체적이라고 본다. */
const TIMING_SCORE: Record<string, number> = {
  "3개월 이내": 30,
  "6개월 이내": 25,
  "1년 이내": 18,
  "1년 이후": 10,
  "미정": 6,
};

function scoreFrom(table: Record<string, number>, key?: string | null): number {
  if (!key) return 0;
  return table[key] ?? 0;
}

/**
 * 창업 적합도 점수(0~100). 투자 여력(30) + 창업 시기(30) + 점포 보유(20) + 상담 구체성(20).
 */
export function computeFitScore(signals: LeadSignals): number {
  const investment = scoreFrom(INVESTMENT_SCORE, signals.expectedInvestment);
  const timing = scoreFrom(TIMING_SCORE, signals.plannedTiming);
  const storefront = signals.hasStorefront === true ? 20 : signals.hasStorefront === false ? 8 : 0;

  // 상담 구체성: 지역·직업·문의내용을 남겼는지(상담 준비도) — 각 항목 부분 점수.
  let detail = 0;
  if (signals.preferredRegion && signals.preferredRegion !== "미정") detail += 8;
  if (signals.currentOccupation) detail += 4;
  if (signals.message && signals.message.trim().length >= 10) detail += 8;

  return Math.max(0, Math.min(100, investment + timing + storefront + detail));
}

/**
 * 점수를 사람이 읽는 문구로 변환한다.
 * 저장된 fitScore만으로도 화면 문구를 복원할 수 있도록 계산과 분리해 두었다.
 */
export function describeFit(score: number): FitDiagnosis {
  const stars = Math.max(1, Math.min(5, Math.round(score / 20)));

  if (score >= 80) {
    return {
      score,
      stars,
      headline: "창업 적합도가 매우 높습니다.",
      description:
        "투자 여력과 창업 시기가 구체적입니다. 전문 컨설턴트가 우선 배정되어 빠르게 연락드립니다.",
    };
  }
  if (score >= 60) {
    return {
      score,
      stars,
      headline: "창업 적합도가 높은 편입니다.",
      description: "상권 조건만 맞으면 진행 가능한 단계입니다. 상권 분석과 함께 안내드리겠습니다.",
    };
  }
  if (score >= 40) {
    return {
      score,
      stars,
      headline: "상권 분석 후 상담을 추천합니다.",
      description: "희망 지역의 상권·입지 조건을 먼저 확인한 뒤 구체적인 계획을 함께 세워보시길 권합니다.",
    };
  }
  return {
    score,
    stars,
    headline: "먼저 창업 상담부터 받아보시길 권합니다.",
    description: "예산·시기 등 기본 조건을 함께 정리하는 것부터 시작하면 좋습니다. 편하게 문의해 주세요.",
  };
}

/** 상담 신호로부터 적합도 진단 전체(점수 + 문구)를 계산한다. */
export function diagnoseFit(signals: LeadSignals): FitDiagnosis {
  return describeFit(computeFitScore(signals));
}

/** 문의 내용에서 관심 분야를 감지하기 위한 키워드 — 태그 : 키워드 목록. */
const KEYWORD_TAGS: { tag: string; keywords: string[] }[] = [
  { tag: "교회카페", keywords: ["교회", "성전", "예배", "교인", "성도"] },
  { tag: "인테리어", keywords: ["인테리어", "리모델링", "시공", "설계", "공사"] },
  { tag: "상권분석", keywords: ["상권", "입지", "자리", "위치", "유동인구"] },
  { tag: "카페", keywords: ["카페", "커피", "베이커리", "디저트"] },
];

/**
 * 상담 자동 분류. 상담 목적(드롭다운) + 문의 내용 키워드에서 태그를 생성한다.
 * 태그는 CRM 필터·성공사례 추천·대시보드 집계에 함께 사용된다.
 */
export function classifyLead(signals: LeadSignals): string[] {
  const tags = new Set<string>();

  if (signals.consultationPurpose) {
    tags.add(signals.consultationPurpose);
  }

  const haystack = (signals.message ?? "").toLowerCase();
  for (const { tag, keywords } of KEYWORD_TAGS) {
    if (keywords.some((word) => haystack.includes(word.toLowerCase()))) {
      tags.add(tag);
    }
  }

  if (signals.hasStorefront === true) tags.add("점포보유");
  if (signals.plannedTiming === "3개월 이내") tags.add("단기창업");

  return [...tags];
}

/**
 * 상담 우선순위 자동 계산 — 예상투자금·창업시기·점포보유여부 기준(CEO 업무지시 4번).
 * 적합도 점수와 분리해 두는 이유: 점수는 상담자에게 보여주는 값이고,
 * 우선순위는 내부 응대 순서를 정하는 값이라 기준이 달라질 수 있기 때문이다.
 */
export function calculatePriority(signals: LeadSignals): LeadPriority {
  const investment = scoreFrom(INVESTMENT_SCORE, signals.expectedInvestment);
  const timing = scoreFrom(TIMING_SCORE, signals.plannedTiming);
  const storefront = signals.hasStorefront === true ? 20 : 0;

  const total = investment + timing + storefront;

  if (total >= 60) return "HIGH";
  if (total >= 35) return "MEDIUM";
  return "LOW";
}

/** 관리자 화면에 채워 넣을 AI 상담 요약 초안(사람이 수정하는 것을 전제로 한다). */
export function buildAiSummary(signals: LeadSignals, fit: FitDiagnosis, priority: LeadPriority): string {
  const parts = [
    `적합도 ${fit.score}점(${priority} 우선순위)`,
    signals.preferredRegion ? `희망지역 ${signals.preferredRegion}` : null,
    signals.plannedTiming ? `창업시기 ${signals.plannedTiming}` : null,
    signals.expectedInvestment ? `예상투자금 ${signals.expectedInvestment}` : null,
    signals.hasStorefront === true
      ? "점포 보유"
      : signals.hasStorefront === false
        ? "점포 미보유"
        : null,
  ].filter(Boolean);

  return parts.join(" · ");
}

/** 우선순위별 권장 다음 액션 초안. */
export function suggestNextAction(priority: LeadPriority): string {
  if (priority === "HIGH") return "24시간 내 전화 상담 후 상권 분석 일정 잡기";
  if (priority === "MEDIUM") return "희망 지역 상권 자료 준비 후 상담 연락";
  return "정보공개서·창업 절차 안내 자료 발송 후 후속 확인";
}
