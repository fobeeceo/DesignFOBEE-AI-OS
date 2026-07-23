"use client";

import { useEffect, useState } from "react";
import { ERP_SNAPSHOT, won } from "@/lib/hq/erpSnapshot";

/** ERP 상세 — POS 판매·원가·재고 발주 (실데이터, SSOT: erp_engine/pos_import, 라이브: /api/hq/erp). */
export default function HqErp() {
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
        <h1 className="text-xl font-bold">ERP</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          POS Import → 레시피 → 재고 차감 → 안전재고 → 발주 → 원가 → KPI
        </p>
      </div>

      <section className="rounded-2xl border border-border p-5">
        <h2 className="text-sm font-bold">📊 매출 요약 ({E.sales.period})</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div><p className="text-xs text-muted-foreground">매출</p><p className="font-bold">{won(E.sales.revenue)}</p></div>
          <div><p className="text-xs text-muted-foreground">판매수량</p><p className="font-bold">{E.sales.qty.toLocaleString()}잔</p></div>
          <div><p className="text-xs text-muted-foreground">할인</p><p className="font-bold">{won(E.sales.discount)}</p></div>
          <div><p className="text-xs text-muted-foreground">상품수</p><p className="font-bold">{E.sales.products}종</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-border p-5">
        <h2 className="mb-3 text-sm font-bold">🏭 메뉴 원가율</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2">메뉴</th><th>판매가</th><th>원가율</th><th>원가</th><th>마진</th>
            </tr>
          </thead>
          <tbody>
            {E.cost.menus.map((m) => {
              const cost = Math.round(m.price * (m.ratio / 100));
              return (
                <tr key={m.name} className="border-b border-border/50">
                  <td className="py-2">{m.name}</td>
                  <td>{won(m.price)}</td>
                  <td className={m.ratio >= 25 ? "font-semibold text-red-500" : ""}>{m.ratio}%</td>
                  <td>{won(cost)}</td>
                  <td className="font-semibold">{won(m.price - cost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted-foreground">평균 원가율 {E.cost.avgRatio}%</p>
      </section>

      {E.menuEngineering.available && (
        <section className="rounded-2xl border border-border p-5">
          <h2 className="mb-1 text-sm font-bold">🎯 메뉴 엔지니어링 — 판매량×마진 분석</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            기준: 평균판매량 {E.menuEngineering.기준_평균판매량}잔 · 인기도 임계값(70% rule) {E.menuEngineering.인기도_임계값}잔 · 평균마진 {won(E.menuEngineering.기준_평균마진)}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold text-red-500">단종 후보 (Dog — 비인기 · 저마진)</h3>
              {E.menuEngineering.단종후보.length < 1 ? (
                <p className="text-xs text-muted-foreground">해당 없음</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {E.menuEngineering.단종후보.map((m) => (
                    <li key={m.메뉴} className="flex justify-between border-b border-border/50 py-1">
                      <span>{m.메뉴}</span>
                      <span className="text-xs text-muted-foreground">{m.판매량}잔 · 원가율 {m.원가율}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold text-amber-600">프로모션 후보 (Puzzle — 고마진인데 안 팔림)</h3>
              {E.menuEngineering.프로모션후보.length < 1 ? (
                <p className="text-xs text-muted-foreground">해당 없음</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {E.menuEngineering.프로모션후보.map((m) => (
                    <li key={m.메뉴} className="flex justify-between border-b border-border/50 py-1">
                      <span>{m.메뉴}</span>
                      <span className="text-xs text-muted-foreground">{m.판매량}잔 · 마진 {won(m.마진)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            방법론: Menu Engineering Matrix(Kasavana &amp; Smith) — 판매량 상위 그룹만 원가율로 판단하지 않고, 판매량×마진을 함께 봐 Star/Plowhorse/Puzzle/Dog 4분류로 실행 제안까지 낸다.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-border p-5">
        <h2 className="mb-3 text-sm font-bold">🍰 디저트 원가 ({E.dessert.count}종 · 평균 원가율 {E.dessert.avgRatio}%)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2">메뉴</th><th>판매가</th><th>원가율</th><th>마진</th>
            </tr>
          </thead>
          <tbody>
            {E.dessert.highRatio.map((m) => {
              const cost = Math.round(m.price * (m.ratio / 100));
              return (
                <tr key={m.name} className="border-b border-border/50">
                  <td className="py-2">{m.name}</td>
                  <td>{won(m.price)}</td>
                  <td className="font-semibold text-red-500">{m.ratio}%</td>
                  <td>{won(m.price - cost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted-foreground">SSOT: 지브릭커피 디저트단가표(28종). 음료 평균 22.6% 대비 디저트 평균 {E.dessert.avgRatio}% — 원가 관리 우선순위.</p>
      </section>

      <section className="rounded-2xl border border-border p-5">
        <h2 className="mb-3 text-sm font-bold">📦 발주 추천 (안전재고 미달 {E.inventory.shortageCount}건)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2">품목</th><th>현재</th><th>적정</th><th>발주추천</th><th>상태</th>
            </tr>
          </thead>
          <tbody>
            {E.inventory.reorders.map((r) => (
              <tr key={r.item} className="border-b border-border/50">
                <td className="py-2">{r.item}</td>
                <td>{r.current}</td>
                <td>{r.safe}</td>
                <td className="font-semibold">{r.order}</td>
                <td>{r.urgent ? <span className="text-red-500">긴급</span> : "필요"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="text-xs text-muted-foreground">
        데이터: `content-automation-agent/src` (pos_import·erp_engine) 실행 산출물 · `/api/hq/erp` 라이브 연결.
      </p>
    </div>
  );
}
