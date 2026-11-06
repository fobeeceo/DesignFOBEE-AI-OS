"use client";

import { useEffect, useState } from "react";

type Order = { id: string; orderNumber: string; storeId: string; storeName: string; status: string; finalAmount: number; pickupName: string; createdAt: string; items: { menuName: string; quantity: number }[] };

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "대기중", color: "#F59E0B" },
  CONFIRMED: { label: "확인됨", color: "#3B82F6" },
  PREPARING: { label: "제조중", color: "#8B5CF6" },
  READY: { label: "준비완료", color: "#10B981" },
  PICKED_UP: { label: "픽업완료", color: "#6B7280" },
  CANCELLED: { label: "취소", color: "#EF4444" },
};

export default function HqOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (s: string) => {
    setLoading(true);
    const params = s ? `?status=${s}` : "";
    fetch(`/api/gbrick/hq/orders${params}`)
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders ?? []); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(status); }, [status]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>주문 현황</h1>
        <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>전체 매장 주문 조회</p>
      </div>

      {/* Status Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ value: "", label: "전체" }, ...Object.entries(STATUS_MAP).map(([v, m]) => ({ value: v, label: m.label }))].map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, cursor: "pointer", borderColor: status === s.value ? "#C8873A" : "#e0d9d0", background: status === s.value ? "#C8873A" : "#fff", color: status === s.value ? "#fff" : "#666" }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8f7f5", borderBottom: "1px solid #e8e0d8" }}>
              {["주문번호", "매장", "고객명", "메뉴", "금액", "상태", "시간"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#666", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#999" }}>로딩 중...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>주문 없음</td></tr>
            ) : orders.map((o, i) => {
              const st = STATUS_MAP[o.status] ?? { label: o.status, color: "#888" };
              const mins = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
              const itemSummary = o.items?.map((it) => `${it.menuName}×${it.quantity}`).join(", ") ?? "—";
              return (
                <tr key={o.id} style={{ borderBottom: "1px solid #f0ebe4", background: i % 2 === 0 ? "#fff" : "#fdfcfb" }}>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: "#888" }}>{o.orderNumber?.slice(-8) ?? o.id.slice(-8)}</td>
                  <td style={{ padding: "12px 16px" }}>{o.storeName}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{o.pickupName}</td>
                  <td style={{ padding: "12px 16px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#666" }}>{itemSummary}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{o.finalAmount.toLocaleString()}원</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: st.color + "22", color: st.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#888", fontSize: 11 }}>{mins < 60 ? mins + "분 전" : Math.floor(mins / 60) + "시간 전"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: "12px 16px", fontSize: 12, color: "#888", borderTop: "1px solid #f0ebe4" }}>
          총 {total}건
        </div>
      </div>
    </div>
  );
}
