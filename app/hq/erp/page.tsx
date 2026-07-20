import { ERP_SNAPSHOT as E, won } from "@/lib/hq/erpSnapshot";

/** ERP 상세 — POS 판매·원가·재고 발주 (실데이터, SSOT: erp_engine/pos_import). */
export default function HqErp() {
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
        데이터: `content-automation-agent/src` (pos_import·erp_engine) 실행 산출물 스냅샷 · 라이브 API 연결 예정.
      </p>
    </div>
  );
}
