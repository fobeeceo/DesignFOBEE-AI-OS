import { describe, it, expect } from "vitest";
import { priceOrderItems, cleanGuestText, type PriceableMenu, type PriceableOption } from "./orderPricing";

const opt = (id: string, name: string, extraPrice: number, groupName: string): PriceableOption => ({ id, name, extraPrice, groupName });
const latte: PriceableMenu = {
  id: "m1", name: "카페라떼", basePrice: 5000, isSoldOut: false, optionsConfigured: true,
  options: [opt("t1", "따뜻하게", 0, "온도"), opt("t2", "아이스", 0, "온도"), opt("k1", "소이밀크", 0, "우유변경"), opt("k2", "오트밀크", 500, "우유변경"),
    opt("a1", "샷추가", 500, "추가옵션"), opt("a2", "디카페인", 500, "추가옵션"), opt("z1", "사이즈업", 1000, "사이즈")],
};
const plain: PriceableMenu = { id: "m2", name: "아메리카노", basePrice: 2500, isSoldOut: false, options: [] };
const defaults = [opt("d1", "바닐라시럽", 500, "추가옵션"), opt("d2", "아이스", 0, "온도")];
const menus = [latte, plain, { ...plain, id: "m3", name: "품절 메뉴", isSoldOut: true }, { ...plain, id: "m4", name: "매장 품절", storeAvailability: [{ isSoldOut: true }] }];
const line = (menuId: string, quantity: number, ids: string[] = []) => ({ menuId, quantity, unitPrice: 1, options: ids.map(id => ({ menuOptionId: id, optionName: "x", extraPrice: 0 })) });
const price = (items: unknown) => priceOrderItems(items, menus, defaults);

describe("priceOrderItems", () => {
  it("ignores the prices and names sent by the client and uses the database", () => {
    const r = price([{ menuId: "m1", quantity: 2, unitPrice: 1, menuName: "공짜", options: [{ menuOptionId: "k2", optionName: "공짜", extraPrice: 0 }, { menuOptionId: "a1", optionName: "공짜", extraPrice: -500 }] }]);
    expect(r).toEqual({
      ok: true, totalAmount: 12000,
      items: [{ menuId: "m1", menuName: "카페라떼", quantity: 2, unitPrice: 6000, options: [
        { menuOptionId: "k2", optionName: "오트밀크", extraPrice: 500 }, { menuOptionId: "a1", optionName: "샷추가", extraPrice: 500 }] }],
    });
  });

  it("adds up several lines with different options", () => {
    const r = price([line("m1", 1, ["k1"]), line("m1", 1, ["k2", "z1"]), line("m2", 3)]);
    expect(r.ok && r.totalAmount).toBe(5000 + 6500 + 7500);
  });

  it("uses the default options only for menus without their own options", () => {
    expect(price([line("m2", 1, ["d1"])]).ok).toBe(true);
    expect(price([line("m1", 1, ["d1"])]).ok).toBe(false); // 카페라떼는 자기 옵션만
  });

  it("does not fall back to defaults when every option of a configured menu is hidden", () => {
    const hiddenAll = { ...plain, id: "m5", optionsConfigured: true };
    expect(priceOrderItems([line("m5", 1, ["d1"])], [hiddenAll], defaults).ok).toBe(false);
    expect(priceOrderItems([line("m5", 1)], [hiddenAll], defaults).ok).toBe(true);
  });

  it("allows only one choice in pick-one groups, many in the others", () => {
    expect(price([line("m1", 1, ["t1", "t2"])]).ok).toBe(false);
    expect(price([line("m1", 1, ["k1", "k2"])]).ok).toBe(false);
    expect(price([line("m1", 1, ["a1", "a2", "z1", "t1", "k1"])]).ok).toBe(true);
  });

  it("rejects unknown, sold-out and hidden menus, and unknown or repeated options", () => {
    expect(price([line("nope", 1)])).toMatchObject({ ok: false, error: expect.stringContaining("판매하지 않는") });
    expect(price([line("m3", 1)])).toMatchObject({ ok: false, error: expect.stringContaining("품절") });
    expect(price([line("m4", 1)])).toMatchObject({ ok: false, error: expect.stringContaining("품절") });
    expect(price([line("m1", 1, ["nope"])]).ok).toBe(false);
    expect(price([line("m1", 1, ["a1", "a1"])]).ok).toBe(false);
  });

  it("rejects bad quantities and malformed bodies", () => {
    for (const q of [0, -1, 1.5, 21, "2", null, undefined]) expect(price([{ menuId: "m2", quantity: q }]).ok).toBe(false);
    for (const bad of [null, undefined, [], "x", {}, [null], [{}], [{ menuId: 1, quantity: 1 }], [{ menuId: "m2", quantity: 1, options: "x" }], [{ menuId: "m2", quantity: 1, options: [null] }]]) {
      expect(price(bad).ok).toBe(false);
    }
    expect(price(Array.from({ length: 31 }, () => line("m2", 1))).ok).toBe(false);
  });
});

describe("cleanGuestText", () => {
  it("removes control characters (printer commands) and trims", () => {
    expect(cleanGuestText("  이대성 ", 20)).toBe("이대성");
    expect(cleanGuestText("a\u001bp\u0000\u0019b", 20)).toBe("a p b");
    expect(cleanGuestText("줄1\n줄2\r\n줄3", 50)).toBe("줄1 줄2 줄3");
    expect(cleanGuestText("가".repeat(30), 20)).toHaveLength(20);
  });
  it("returns undefined for empty or non-text values", () => {
    for (const v of ["", "   ", "\u001b\u0007", 5, null, undefined, {}]) expect(cleanGuestText(v, 20)).toBeUndefined();
  });
});
