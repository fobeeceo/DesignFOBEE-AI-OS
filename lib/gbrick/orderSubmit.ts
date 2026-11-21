// 주문 접수 — 일반 주문(/api/gbrick/orders)과 함께오더 제출이 같은 규칙을 쓴다.
// 금액·옵션은 서버가 DB로 다시 계산하고(화면이 보낸 가격은 무시), 영업시간·매장 상태·폭주 제한을 확인한다.
import { sbOrderRepo, sbMenuRepo, findStoreStrict, getDefaultOptions, countOrdersSince } from "@/lib/gbrick/repositories/supabase";
import { isLaunchStore, NOT_LAUNCHED_MESSAGE } from "@/lib/gbrick/launch";
import { isWithinOperatingHours, todayHoursLabel } from "@/lib/gbrick/storeHours";
import { priceOrderItems, cleanGuestText, type PriceableMenu } from "@/lib/gbrick/orderPricing";
import type { OrderDto } from "@/lib/gbrick/repositories/types";

// 한 매장에 10분 동안 이 수를 넘는 주문이 들어오면 잠시 막는다 (잘못된 반복 요청으로 주방 프린터가 도는 것을 막기 위함)
const MAX_ORDERS_PER_10_MIN = 40;

export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GB${date}${rand}`;
}

export type SubmitResult = { ok: true; order: OrderDto } | { ok: false; error: string; status: number };
const fail = (error: string, status: number): SubmitResult => ({ ok: false, error, status });

export interface SubmitInput {
  storeId: unknown;
  items: unknown;
  pickupName?: unknown;
  note?: unknown;
  /** 로그인한 회원 번호 (확인된 활성 회원만 넘긴다). 없으면 비회원 주문 */
  memberId: string | null;
}

/** 예상하지 못한 오류(DB 등)는 던진다 — 호출한 쪽이 "접수하지 못했어요"로 알린다 */
export async function submitOrder(input: SubmitInput): Promise<SubmitResult> {
  const { storeId } = input;
  if (typeof storeId !== "string" || !storeId) return fail("매장을 선택해 주세요", 400);
  if (!isLaunchStore(storeId)) return fail(NOT_LAUNCHED_MESSAGE, 403);

  const store = await findStoreStrict(storeId);
  if (!store) return fail("매장을 찾을 수 없습니다", 404);
  if (store.status !== "ACTIVE") return fail("지금은 주문을 받지 않습니다 (영업 준비중)", 409);
  if (!isWithinOperatingHours(store.operatingHours)) {
    const hours = todayHoursLabel(store.operatingHours);
    return fail(`지금은 영업시간이 아니라 주문할 수 없어요${hours ? ` (오늘 ${hours})` : ""}`, 409);
  }

  if (await countOrdersSince(storeId, new Date(Date.now() - 10 * 60_000).toISOString()) >= MAX_ORDERS_PER_10_MIN) {
    return fail("지금 주문이 많이 몰려 있어요. 잠시 후 다시 시도해 주세요", 429);
  }

  const [categories, defaultOptions] = await Promise.all([sbMenuRepo.findCategories(storeId), getDefaultOptions()]);
  const menus = categories.flatMap(c => c.menus) as unknown as PriceableMenu[];
  const priced = priceOrderItems(input.items, menus, defaultOptions);
  if (!priced.ok) return fail(priced.error, 400);

  const order = await sbOrderRepo.create({
    orderNumber: generateOrderNumber(),
    storeId,
    customerId: input.memberId ?? undefined,
    isGuest: !input.memberId,
    items: priced.items,
    pickupName: cleanGuestText(input.pickupName, 20),
    note: cleanGuestText(input.note, 100),
    totalAmount: priced.totalAmount,
    finalAmount: priced.totalAmount,
    pointEarned: 0,
    pointUsed: 0,
    couponDiscount: 0,
    couponIssueId: undefined,
  });
  return { ok: true, order };
}
