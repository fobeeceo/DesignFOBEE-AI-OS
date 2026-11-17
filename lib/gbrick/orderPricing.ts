// 주문 금액·옵션 검증 — 화면이 보낸 가격은 믿지 않고, DB의 메뉴·옵션으로 다시 계산한다.
import { isSingleSelectGroup } from "@/lib/gbrick/optionGroups";
import type { OrderItemInput } from "@/lib/gbrick/repositories/types";

export interface PriceableOption { id: string; name: string; extraPrice: number; groupName?: string | null }
export interface PriceableMenu {
  id: string;
  name: string;
  basePrice: number;
  isSoldOut: boolean;
  storeAvailability?: { isSoldOut: boolean }[];
  options: PriceableOption[];
  optionsConfigured?: boolean;
}

export const MAX_ORDER_LINES = 30;
export const MAX_QUANTITY = 20;
export const MAX_OPTIONS_PER_ITEM = 20;

export type PriceResult = { ok: true; items: OrderItemInput[]; totalAmount: number } | { ok: false; error: string };

const fail = (error: string): PriceResult => ({ ok: false, error });
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * @param menus    이 매장에서 지금 판매 중인 메뉴 (옵션 포함)
 * @param defaults 옵션을 따로 등록하지 않은 메뉴에 고객 앱이 보여 주는 기본 옵션
 */
export function priceOrderItems(rawItems: unknown, menus: PriceableMenu[], defaults: PriceableOption[]): PriceResult {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return fail("주문할 메뉴를 담아 주세요");
  if (rawItems.length > MAX_ORDER_LINES) return fail("한 번에 주문할 수 있는 메뉴 수를 넘었습니다");

  const byId = new Map(menus.map(m => [m.id, m]));
  const items: OrderItemInput[] = [];
  let totalAmount = 0;

  for (const raw of rawItems) {
    if (!isObject(raw) || typeof raw.menuId !== "string") return fail("주문 내용이 올바르지 않습니다");
    const quantity = raw.quantity;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return fail(`수량은 1~${MAX_QUANTITY}개로 주문해 주세요`);
    }

    const menu = byId.get(raw.menuId);
    if (!menu) return fail("지금 판매하지 않는 메뉴가 있습니다. 새로고침 후 다시 담아 주세요");
    if (menu.storeAvailability?.[0]?.isSoldOut ?? menu.isSoldOut) return fail(`'${menu.name}'은(는) 품절입니다`);

    const rawOptions = raw.options ?? [];
    if (!Array.isArray(rawOptions) || rawOptions.length > MAX_OPTIONS_PER_ITEM) return fail("옵션 선택이 올바르지 않습니다");
    // 옵션을 따로 등록한 메뉴는 그 옵션만, 아니면 기본 옵션 — 고객 앱이 보여 주는 것과 같은 규칙
    const allowed = menu.options.length > 0 || menu.optionsConfigured ? menu.options : defaults;
    const chosen: PriceableOption[] = [];
    for (const rawOption of rawOptions) {
      const id = isObject(rawOption) ? rawOption.menuOptionId : undefined;
      const option = typeof id === "string" ? allowed.find(o => o.id === id) : undefined;
      if (!option || chosen.some(c => c.id === option.id)) return fail(`'${menu.name}'에 선택할 수 없는 옵션이 있습니다. 새로고침 후 다시 담아 주세요`);
      chosen.push(option);
    }
    const singles = new Set<string>();
    for (const option of chosen) {
      if (!isSingleSelectGroup(option.groupName)) continue;
      if (singles.has(option.groupName!)) return fail(`'${menu.name}'의 ${option.groupName}은(는) 하나만 선택할 수 있습니다`);
      singles.add(option.groupName!);
    }

    const unitPrice = menu.basePrice + chosen.reduce((sum, o) => sum + o.extraPrice, 0);
    totalAmount += unitPrice * quantity;
    items.push({
      menuId: menu.id,
      menuName: menu.name,
      quantity,
      unitPrice,
      options: chosen.map(o => ({ menuOptionId: o.id, optionName: o.name, extraPrice: o.extraPrice })),
    });
  }
  return { ok: true, items, totalAmount };
}

/** 손님이 입력한 글(픽업 이름·메모) 정리 — 제어문자를 지우고 길이를 제한한다. 영수증 프린터 명령으로 해석되는 것을 막는다. */
export function cleanGuestText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
  return text || undefined;
}
