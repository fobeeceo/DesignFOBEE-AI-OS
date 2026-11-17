// 고객 앱 소프트 런칭 설정 (2026-11-17 대표 승인)
// 이 파일에는 import 를 두지 않는다 — 서버·브라우저·프린터 코드가 모두 읽는다.

/** 온라인 주문을 받는 매장. 나머지 매장은 "오픈 예정"으로 보이고 서버도 주문을 거절한다. */
export const LAUNCH_STORE_IDS: readonly string[] = ["store-001"]; // GBRICK Coffee 은평뉴타운 본점

export const isLaunchStore = (storeId: string) => LAUNCH_STORE_IDS.includes(storeId);

/** 앱 결제(PG) 연결 전까지는 픽업할 때 매장 카운터에서 결제한다 */
export const ON_SITE_PAYMENT_NOTICE = "결제는 픽업하실 때 매장 카운터에서 해 주세요.";

export const NOT_LAUNCHED_MESSAGE = "이 매장은 곧 오픈해요. 지금은 은평뉴타운 본점에서 주문할 수 있어요.";
