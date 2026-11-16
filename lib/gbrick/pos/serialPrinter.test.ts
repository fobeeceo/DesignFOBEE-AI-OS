import { describe, it, expect } from "vitest";
import { buildKitchenTicket, buildTestTicket } from "./serialPrinter";

const decode = (bytes: Uint8Array) => new TextDecoder("euc-kr").decode(bytes);

describe("buildKitchenTicket", () => {
  const order = {
    orderNumber: "GB20261116ABC123",
    pickupName: "이대성",
    note: "얼음 적게",
    finalAmount: 8900,
    createdAt: "2026-11-16T00:34:00.000Z",
    items: [
      { menuName: "지브릭 라떼", quantity: 2, options: [{ optionName: "아이스" }, { optionName: "바닐라시럽" }] },
      { menuName: "말차", quantity: 1 },
    ],
  };
  const bytes = buildKitchenTicket(order, "GBRICK Coffee 은평뉴타운 본점");
  const text = decode(bytes);

  it("starts with printer reset + Hangul mode and ends with a paper cut", () => {
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x1b, 0x40, 0x1c, 0x26]);
    expect(Array.from(bytes.slice(-4))).toEqual([0x1d, 0x56, 0x42, 0x00]);
  });

  it("encodes Korean as KS X 1001 so the printer can read it", () => {
    for (const expected of ["#ABC123", "이대성", "지브릭 라떼 x2", "  - 아이스", "  - 바닐라시럽", "말차 x1", "메모: 얼음 적게", "8,900원", "은평뉴타운 본점"]) {
      expect(text).toContain(expected);
    }
  });

  it("replaces characters the printer cannot print with ?", () => {
    const out = decode(buildKitchenTicket({ ...order, pickupName: "☕뷁", items: [] }, "매장"));
    expect(out).toContain("??");
  });

  it("falls back to 손님 when no pickup name is given", () => {
    expect(decode(buildKitchenTicket({ ...order, pickupName: null }, "매장"))).toContain("손님");
  });
});

describe("buildTestTicket", () => {
  it("contains the test text", () => {
    expect(decode(buildTestTicket("매장"))).toContain("테스트 출력");
  });
});
