import { describe, it, expect } from "vitest";
import { costOf, highCostMenus, dashboardKpis } from "./kpi";
import { ERP_SNAPSHOT } from "./erpSnapshot";
import type { CostMenu } from "./types";

describe("costOf", () => {
  it("computes rounded cost from price and ratio percent", () => {
    expect(costOf(5400, 30.9)).toBe(1669); // 5400 * 0.309 = 1668.6 -> round
  });

  it("returns 0 when ratio is 0", () => {
    expect(costOf(1000, 0)).toBe(0);
  });
});

describe("highCostMenus", () => {
  const menus: CostMenu[] = [
    { name: "A", price: 1000, ratio: 10 },
    { name: "B", price: 1000, ratio: 25 },
    { name: "C", price: 1000, ratio: 30.9 },
  ];

  it("keeps only menus at or above the default 25% threshold", () => {
    expect(highCostMenus(menus).map((m) => m.name)).toEqual(["B", "C"]);
  });

  it("respects a custom threshold", () => {
    expect(highCostMenus(menus, 30).map((m) => m.name)).toEqual(["C"]);
  });
});

describe("dashboardKpis", () => {
  const kpis = dashboardKpis(ERP_SNAPSHOT);

  it("returns exactly the 8 KPIs in the fixed Priority-4 order", () => {
    expect(kpis.map((k) => k.label)).toEqual([
      "매출 (집계기간 기준)",
      "발주 승인 대기",
      "긴급 재고",
      "AI 실패 건수",
      "오늘 일정",
      "오늘 AI 작업 완료율",
      "전국 매장 현황",
      "평균 원가율",
    ]);
  });

  it("marks the four not-yet-connected KPIs as pending", () => {
    const pendingLabels = kpis.filter((k) => k.pending).map((k) => k.label);
    expect(pendingLabels).toEqual([
      "AI 실패 건수",
      "오늘 일정",
      "오늘 AI 작업 완료율",
      "전국 매장 현황",
    ]);
  });

  it("derives 발주 승인 대기 count from purchaseOrders length, not a hardcoded number", () => {
    const kpi = kpis.find((k) => k.label === "발주 승인 대기")!;
    expect(kpi.value).toBe(`${ERP_SNAPSHOT.inventory.purchaseOrders.length}건`);
  });
});
