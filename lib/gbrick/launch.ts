// 고객 앱 소프트 런칭 설정 (2026-11-17 대표 승인)
// 이 파일에는 import 를 두지 않는다 — 서버·브라우저·프린터 코드가 모두 읽는다.

/** 온라인 주문을 받는 매장. 나머지 매장은 "오픈 예정"으로 보이고 서버도 주문을 거절한다. */
export const LAUNCH_STORE_IDS: readonly string[] = ["store-001"]; // GBRICK Coffee 은평뉴타운 본점

export const isLaunchStore = (storeId: string) => LAUNCH_STORE_IDS.includes(storeId);

/** 앱 결제(PG) 연결 전까지는 픽업할 때 매장 카운터에서 결제한다 */
export const ON_SITE_PAYMENT_NOTICE = "결제는 픽업하실 때 매장 카운터에서 해 주세요.";

export const NOT_LAUNCHED_MESSAGE = "이 매장은 곧 오픈해요. 지금은 은평뉴타운 본점에서 주문할 수 있어요.";

/**
 * 회원 포인트 적립률 (픽업·결제가 끝난 주문에 대해).
 * 0 = 적립하지 않음. 테스트 기간 중에는 적립하지 않는다 (대표 결정 2026-11-18 — 다른 매장은 본사 결제 후 정산이라
 * 포인트를 주면 정산이 복잡해진다). 켜기 전에 매장 간 정산 방식부터 정할 것. 켤 때 이 값만 바꾼다 (예: 0.02 = 2%).
 * 참고: lib/gbrick/constants.ts 의 POINT_DEFAULTS.rate(0.02) 는 예전 초안이며 아직 승인되지 않았다.
 */
export const MEMBER_POINT_RATE = 0;
