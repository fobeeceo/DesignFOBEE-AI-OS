"use client";

import { useEffect, useState } from "react";
import { ERP_SNAPSHOT, won } from "@/lib/hq/erpSnapshot";
import type { ErpApiResponse } from "@/lib/hq/types";
import { dashboardKpis, highCostMenus, type DashboardKpi } from "@/lib/hq/kpi";

/** 표시 전용 — 계산은 lib/hq/kpi.ts의 dashboardKpis()가 전담한다. */
function Stat({ label, value, sub, pending }: DashboardKpi) {
  return (
    <div className={`rounded-2xl border p-5 ${pending ? "border-dashed border-border/60 bg-muted/20" : "border-border bg-background"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${pending ? "text-muted-foreground" : ""}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** CEO Dashboard — 매출·재고·원가·발주·판매순위·KPI 한눈에 (실데이터). */
export default function HqDashboard() {
  const [E, setE] = useState(ERP_SNAPSHOT);
  useEffect(() => {
    fetch("/api/hq/erp")
      .then((r) => r.json() as Promise<ErpApiResponse>)
      .then((d) => { if (d.ok) setE(d.data); })
      .catch(() => {});
  }, []);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">CEO Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {E.store} · 기준일 {E.updatedAt} · POS {E.sales.period}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {dashboardKpis(E).map((k) => <Stat key={k.label} {...k} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border p-5">
          <h2 className="text-sm font-bold">🏆 판매 순위 (수량)</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {E.topByQty.map((t, i) => (
              <li key={t.name} className="flex items-center justify-between text-sm">
                <span><span className="mr-2 text-muted-foreground">{i + 1}</span>{t.name}</span>
                <span className="font-semibold">{t.qty.toLocaleString()}잔 · {won(t.revenue)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border p-5">
          <h2 className="text-sm font-bold">📦 발주 추천 (안전재고 미달)</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {E.inventory.reorders.map((r) => (
              <li key={r.item} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {r.urgent && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">긴급</span>}
                  {r.item}
                </span>
                <span className="font-semibold">{r.order}개 <span className="text-muted-foreground">(현 {r.current}/적정 {r.safe})</span></span>
              </li>
            ))}
          </ul>
          <a href="/hq/erp" className="mt-3 inline-block text-xs font-semibold text-accent underline underline-offset-4">
            ERP 전체 보기 →
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-border p-5">
        <h2 className="text-sm font-bold">⚠️ 고원가 메뉴 (원가율 25%+)</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {highCostMenus(E.cost.menus).map((m) => (
            <span key={m.name} className="rounded-full border border-border px-3 py-1 text-xs">
              {m.name} <span className="font-semibold text-red-500">{m.ratio}%</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
