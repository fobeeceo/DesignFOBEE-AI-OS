import { describe, it, expect } from "vitest";
import { mergeGroupLines, groupNote, isRoomCode, newRoomCode, cleanName, subtotal, type GroupLine } from "./groupOrder";

const line = (menuId: string, quantity: number, opts: string[] = [], unitPrice = 1000): GroupLine => ({
  menuId, menuName: menuId, quantity, unitPrice, options: opts.map(id => ({ menuOptionId: id, optionName: id, extraPrice: 0 })),
});

describe("함께오더 합치기", () => {
  it("같은 메뉴·같은 옵션은 수량을 더한다 (옵션 순서가 달라도)", () => {
    const merged = mergeGroupLines([{ items: [line("m1", 1, ["a", "b"])] }, { items: [line("m1", 2, ["b", "a"])] }]);
    expect(merged).toEqual([{ menuId: "m1", quantity: 3, options: [{ menuOptionId: "a" }, { menuOptionId: "b" }] }]);
  });
  it("옵션이 다르면 다른 줄", () => {
    expect(mergeGroupLines([{ items: [line("m1", 1, ["a"])] }, { items: [line("m1", 1, ["b"])] }])).toHaveLength(2);
  });
  it("한 줄 수량이 20을 넘으면 여러 줄로 나눈다", () => {
    const merged = mergeGroupLines([{ items: [line("m1", 20)] }, { items: [line("m1", 5)] }]);
    expect(merged.map(l => l.quantity)).toEqual([20, 5]);
  });
  it("화면이 보낸 가격은 합친 결과에 들어가지 않는다 (서버가 다시 계산)", () => {
    expect(JSON.stringify(mergeGroupLines([{ items: [line("m1", 1, [], 99999)] }]))).not.toContain("99999");
  });
  it("소계", () => { expect(subtotal([line("a", 2, [], 3000), line("b", 1, [], 500)])).toBe(6500); });
});

describe("함께오더 코드·이름·메모", () => {
  it("방 코드는 8자리이고 헷갈리는 글자가 없다", () => {
    for (let i = 0; i < 200; i++) { const c = newRoomCode(); expect(isRoomCode(c)).toBe(true); expect(c).not.toMatch(/[01OIL]/); }
  });
  it("이상한 코드는 거절", () => {
    for (const v of ["", "abc", "ABCDEFG", "ABCDEFGHI", "ABCD0FGH", "abcdefgh", undefined, 12345678]) expect(isRoomCode(v)).toBe(false);
  });
  it("이름은 제어문자를 지우고 10자까지", () => {
    expect(cleanName("철\u001b수")).toBe("철 수");
    expect(cleanName("가".repeat(30))).toHaveLength(10);
    expect(cleanName("   ")).toBeUndefined();
  });
  it("주방 메모", () => {
    expect(groupNote(["대성", "영희"])).toBe("함께오더 2명(대성·영희)");
    expect(groupNote(["대성"], "얼음 적게")).toBe("함께오더 1명(대성) / 얼음 적게");
  });
});
