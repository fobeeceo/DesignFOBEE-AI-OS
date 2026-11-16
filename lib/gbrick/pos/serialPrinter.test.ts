import { describe, it, expect } from "vitest";

// 주문서 시각은 매장 PC의 현지 시각으로 찍힌다 — 시험은 한국 시각으로 고정
process.env.TZ = "Asia/Seoul";
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
    for (const expected of ["#ABC123", "이대성", "지브릭 라떼 x2", "  - 아이스", "  - 바닐라시럽", "말차 x1", "메모: 얼음 적게", "수량 3개", "합계 8,900원", "은평뉴타운 본점"]) {
      expect(text).toContain(expected);
    }
  });

  it("replaces characters the printer cannot print with ?", () => {
    const out = decode(buildKitchenTicket({ ...order, pickupName: "☕뷁", items: [] }, "매장"));
    expect(out).toContain("??");
  });

  it("prints the order time in the shop's local time, with the date", () => {
    // 00:34 UTC = 09:34 KST
    expect(text).toContain("주문 11/16 오전 09:34");
  });

  it("leaves no blank line when the customer gave no pickup name", () => {
    const out = decode(buildKitchenTicket({ ...order, pickupName: "" }, "매장"));
    expect(out).not.toContain("손님");
    expect(out).toMatch(/#ABC123\n[^\n]*주문 11\/16/);
  });
});

describe("buildTestTicket", () => {
  it("contains the test text", () => {
    expect(decode(buildTestTicket("매장"))).toContain("테스트 출력");
  });
});
