"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Store = {
  id: string; code: string; name: string; status: string;
  address: string; phone: string; pointRate: number; stampGoal: number;
  stats?: { todayRevenue: number; todayOrders: number; monthRevenue: number } | null;
};

const STATUS_COLOR: Record<string, string> = { ACTIVE: "#10B981", INACTIVE: "#EF4444", PREPARING: "#F59E0B" };
const STATUS_LABEL: Record<string, string> = { ACTIVE: "운영중", INACTIVE: "휴업", PREPARING: "준비중" };

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gbrick/hq/stores")
      .then((r) => r.json())
      .then((d) => setStores(d.stores ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "#999" }}>로딩 중...</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>매장 관리</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>전체 {stores.length}개 매장</p>
        </div>
        <button style={{ background: "#C8873A", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
          + 매장 추가
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {stores.map((s) => (
          <div key={s.id} style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f0ebe4" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, background: "#f0ebe4", color: "#888", padding: "2px 8px", borderRadius: 20 }}>{s.code}</span>
                  <span style={{ fontSize: 11, background: STATUS_COLOR[s.status] + "22", color: STATUS_COLOR[s.status], padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2C1A0E" }}>{s.name}</div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>📍 {s.address}</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>📞 {s.phone}</div>

            {s.stats && s.stats.todayRevenue > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "#f8f7f5", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#888" }}>오늘 매출</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginTop: 2 }}>{s.stats.todayRevenue.toLocaleString()}원</div>
                </div>
                <div style={{ background: "#f8f7f5", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#888" }}>이달 매출</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginTop: 2 }}>{(s.stats.monthRevenue / 10000).toFixed(0)}만원</div>
                </div>
              </div>
            ) : (
              <div style={{ background: "#f8f7f5", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: "#aaa", textAlign: "center" }}>
                오픈 준비 중
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, fontSize: 12, color: "#888" }}>포인트 {(s.pointRate * 100).toFixed(0)}% · 스탬프 {s.stampGoal}개</div>
              <button style={{ background: "#2C1A0E", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
                상세
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
