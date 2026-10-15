export const WORK_DAYS_KO = ["월", "화", "수", "목", "금", "토", "일"] as const;
export type WorkDayKo = (typeof WORK_DAYS_KO)[number];

/** HH:mm 두 시각 사이 실근로시간(소수). 휴게시간 제외. */
export function netHours(start: string, end: string, breakMin: number): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  return Math.max(0, (toMin(end) - toMin(start) - breakMin) / 60);
}

/**
 * 주휴수당 계산.
 *
 * 법정 지급 기준(주 15시간 이상)과 무관하게 계산값을 반환한다.
 * 기준 미달이어도 자동 배제하지 않고, legallyRequired 플래그만 구분한다.
 *
 * 주휴시간 = (주 소정근로시간 / 40) × 8  ← 단시간 근로자 비례 계산
 * 주휴수당 = 주휴시간 × 시급
 */
export function calcWeeklyAllowance(wkHours: number, hourlyWage: number) {
  const wkAllowHours = Math.round((wkHours / 40) * 8 * 100) / 100;
  const amount = Math.round(wkAllowHours * hourlyWage);
  return {
    wkAllowHours,
    amount,
    legallyRequired: wkHours >= 15,
  };
}

/**
 * 퇴직급여 지급 대상 판단.
 *
 * 기준: 계속 근로기간 1년 이상 + 4주 평균 주 소정근로시간 15시간 이상.
 * 어느 조건이 미달이어도 자동 배제하지 않고, 미달 근거를 note로 반환한다.
 * endDate 미입력(기간의 정함 없음)은 오늘 날짜로 계산한다.
 */
export function calcSeveranceEligibility(
  wkHours: number,
  startDate: string | undefined,
  endDate: string | undefined
): { eligible: boolean; note: string } {
  if (!startDate) return { eligible: false, note: "근로 시작일 미입력" };

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffDays = (end.getTime() - start.getTime()) / 86_400_000;
  const diffMonths = Math.floor(diffDays / 30.44);

  const hourOk = wkHours >= 15;
  const periodOk = diffDays >= 365;

  if (hourOk && periodOk) {
    return { eligible: true, note: `주 ${wkHours}h · ${diffMonths}개월 이상 — 지급 대상` };
  }

  const reasons: string[] = [];
  if (!hourOk) reasons.push(`주 ${wkHours}h (기준 15h 미달)`);
  if (!periodOk) reasons.push(`${diffMonths}개월 (기준 12개월 미달)`);
  return { eligible: false, note: reasons.join(" / ") };
}

/** 2025년 최저시급 (2026년은 10,320원으로 인상 예정 — 실값 확인 후 업데이트). */
export const MIN_HOURLY_WAGE = 10_030;
