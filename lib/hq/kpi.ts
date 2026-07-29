/**
 * HQ 계산 레이어 — Dashboard·ERP 상세가 화면에 쓰는 모든 파생값(KPI·원가·임계값 필터)은
 * 여기서만 계산한다. 컴포넌트(app/hq/**)는 이 모듈이 반환한 값을 그대로 표시(Display)만 한다.
 */
import type { CostMenu, ErpData } from "./types";
import { won } from "./format";

/** 판매가×원가율 → 원가(원 단위 반올림). 메뉴 원가·디저트 원가에서 공통으로 쓰던 계산을 통합. */
export function costOf(price: number, ratioPercent: number): number {
  return Math.round(price * (ratioPercent / 100));
}

/** 원가율이 threshold(%) 이상인 메뉴만 추린다(고원가 메뉴 경고 기준). */
export function highCostMenus(menus: CostMenu[], thresholdPercent = 25): CostMenu[] {
  return menus.filter((m) => m.ratio >= thresholdPercent);
}

export type DashboardKpi = { label: string; value: string; sub?: string; pending?: boolean };

/**
 * CEO Dashboard 첫 화면 KPI 8종(업무지시서 v1.0 Priority 4 순서 고정: 매출→발주승인대기→
 * 긴급재고→AI실패건수→오늘일정→AI작업완료율→전국매장현황, 마지막에 평균원가율 보조지표).
 * 실데이터가 연결되지 않은 항목은 `pending: true`로 표시(추측 수치 없음).
 */
export function dashboardKpis(data: ErpData): DashboardKpi[] {
  return [
    { label: "매출 (집계기간 기준)", value: won(data.sales.revenue), sub: data.sales.period },
    {
      label: "발주 승인 대기",
      value: `${data.inventory.purchaseOrders.length}건`,
      sub: "ERP 추천 기준 · Notion 승인 큐와 별도 확인 필요",
    },
    {
      label: "긴급 재고",
      value: `${data.inventory.urgentCount}건`,
      sub: `전체 재고부족 ${data.inventory.shortageCount}건`,
    },
    { label: "AI 실패 건수", value: "연결 필요", sub: "Notion 실패/반려 집계 미연동 (TODO)", pending: true },
    { label: "오늘 일정", value: "연결 필요", sub: "Google Calendar OAuth 대기 (TODO)", pending: true },
    { label: "오늘 AI 작업 완료율", value: "연결 필요", sub: "실행 로그 집계 미구축 (TODO)", pending: true },
    { label: "전국 매장 현황", value: "준비 중", sub: "타 매장 POS 데이터 확보 후 제공 예정", pending: true },
    { label: "평균 원가율", value: `${data.cost.avgRatio}%`, sub: `메뉴 ${data.masters.menus}종` },
  ];
}
