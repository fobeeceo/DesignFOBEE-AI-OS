// STEP 7: AI 예상 견적 단가 설정
//
// ⚠️ 매우 중요 — 아래 단가는 전부 임시 플레이스홀더입니다.
// 실제 디자인포비 시공 단가(자재비·인건비·지역별 차이 등)로 반드시 교체한 뒤
// 운영 환경에 배포해야 합니다. 지금 상태로 실제 고객에게 노출하면 안 됩니다.
//
// 교체 방법: 아래 STYLE_BASE_PRICE_PER_SQM, ROOM_TYPE_MULTIPLIER 값만 실제 단가로 바꾸면
// 나머지 계산 로직(services/estimateService.ts)은 그대로 재사용된다.

/** 스타일별 ㎡당 기준 단가 (원) — TODO: 실제 값으로 교체 */
export const STYLE_BASE_PRICE_PER_SQM: Record<string, number> = {
  minimal: 800_000,
  modern: 900_000,
  scandinavian: 850_000,
  industrial: 950_000,
  japandi: 900_000,
  mid_century: 1_000_000,
  hanok: 1_200_000,
  hotel_lounge: 1_500_000,
};

/**
 * 공간 유형별 배율 — TODO: 실제 값으로 교체.
 * 주거(거실~원룸): 배관/설비 있는 주방·욕실만 할증.
 * 상업/교회/전시(사무실~전시장): 설비·마감 난이도에 따라 임시 할증치를 걸어두었다.
 */
export const ROOM_TYPE_MULTIPLIER: Record<string, number> = {
  // 주거
  living_room: 1.0,
  bedroom: 1.0,
  kitchen: 1.35,
  bathroom: 1.4,
  study: 0.95,
  studio: 1.05,
  // 상업 · 오피스
  office: 1.1,
  meeting_room: 1.05,
  lobby: 1.15,
  // 호텔
  guest_room: 1.1,
  // 교회
  chapel: 1.15,
  // 전시
  exhibition_hall: 1.2,
};

/** 예상 범위 폭 (기준가 대비 ±비율) */
export const ESTIMATE_RANGE_RATIO = 0.15;

export const DEFAULT_PRICE_PER_SQM = 900_000;

export function calculateEstimateRange(areaSqm: number, roomTypeId: string, styleId: string) {
  const basePrice = STYLE_BASE_PRICE_PER_SQM[styleId] ?? DEFAULT_PRICE_PER_SQM;
  const multiplier = ROOM_TYPE_MULTIPLIER[roomTypeId] ?? 1.0;
  const total = areaSqm * basePrice * multiplier;

  return {
    pricePerSqm: Math.round(basePrice * multiplier),
    minPrice: Math.round(total * (1 - ESTIMATE_RANGE_RATIO)),
    maxPrice: Math.round(total * (1 + ESTIMATE_RANGE_RATIO)),
  };
}
