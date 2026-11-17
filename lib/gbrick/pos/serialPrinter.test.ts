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
    for (const expected of ["#ABC123", "이대성", "지브릭 라떼 x2", "   + 아이스", "   + 바닐라시럽", "말차 x1", "메모: 얼음 적게", "수량 3개", "합계 8,900원", "은평뉴타운 본점"]) {
      expect(text).toContain(expected);
    }
  });

  it("replaces characters the printer cannot print with ?", () => {
    const out = decode(buildKitchenTicket({ ...order, pickupName: "☕뷁", items: [] }, "매장"));
    expect(out).toContain("??");
  });

  it("tells the counter that payment is collected on site", () => {
    expect(text).toContain("현장 결제 (카운터에서 받기)");
  });

  it("never lets guest-typed control characters reach the printer as commands", () => {
    // ESC p 0 25 250 = 금전함 열기, GS V 0 = 용지 절단, ESC @ = 초기화 — 손님이 이름·메모에 넣어 보낼 수 있는 것들
    const hostile = buildKitchenTicket({ ...order, pickupName: "a\u001bp\u0000\u0019\u00fab", note: "x\u001dV\u0000y", items: [{ menuName: "m\u001b@z", quantity: 1 }] }, "매장");
    const contains = (bytes: number[]) => Array.from(hostile).some((_, i) => bytes.every((b, j) => hostile[i + j] === b));
    expect(contains([0x1b, 0x70])).toBe(false);              // 금전함
    expect(contains([0x1d, 0x56, 0x00, 0x79])).toBe(false);  // 손님 글 뒤에 붙은 절단 (코드가 넣는 절단은 GS V B 0)
    // 초기화(ESC @)는 코드가 맨 앞에 한 번만 넣는다
    expect(Array.from(hostile).filter((_, i) => hostile[i] === 0x1b && hostile[i + 1] === 0x40)).toHaveLength(1);
    expect(decode(hostile)).toContain("a p");               // 글자는 공백으로 바뀌어 남는다
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
