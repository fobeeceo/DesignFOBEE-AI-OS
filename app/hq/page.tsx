"use client";

import { useEffect, useState } from "react";
import { ERP_SNAPSHOT, won } from "@/lib/hq/erpSnapshot";

function Stat({ label, value, sub, pending }: { label: string; value: string; sub?: string; pending?: boolean }) {
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
      .then((r) => r.json())
      .then((d) => { if (d?.data) setE(d.data); })
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
        <Stat label="매출 (집계기간 기준)" value={won(E.sales.revenue)} sub={E.sales.period} />
        <Stat label="발주 승인 대기" value={`${E.inventory.purchaseOrders.length}건`} sub="ERP 추천 기준 · Notion 승인 큐와 별도 확인 필요" />
        <Stat label="긴급 재고" value={`${E.inventory.urgentCount}건`} sub={`전체 재고부족 ${E.inventory.shortageCount}건`} />
        <Stat label="AI 실패 건수" value="연결 필요" sub="Notion 실패/반려 집계 미연동 (TODO)" pending />
        <Stat label="오늘 일정" value="연결 필요" sub="Google Calendar OAuth 대기 (TODO)" pending />
        <Stat label="오늘 AI 작업 완료율" value="연결 필요" sub="실행 로그 집계 미구축 (TODO)" pending />
        <Stat label="전국 매장 현황" value="준비 중" sub="타 매장 POS 데이터 확보 후 제공 예정" pending />
        <Stat label="평균 원가율" value={`${E.cost.avgRatio}%`} sub={`메뉴 ${E.masters.menus}종`} />
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
          {E.cost.menus.filter((m) => m.ratio >= 25).map((m) => (
            <span key={m.name} className="rounded-full border border-border px-3 py-1 text-xs">
              {m.name} <span className="font-semibold text-red-500">{m.ratio}%</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
