"use client";

import { useEffect, useState } from "react";

type HqStats = {
  today: { revenue: number; orders: number; newCustomers: number; avgOrderValue: number };
  yesterday: { revenue: number; orders: number; newCustomers: number; avgOrderValue: number };
  thisMonth: { revenue: number; orders: number; newCustomers: number };
  lastMonth: { revenue: number; orders: number; newCustomers: number };
  totalCustomers: number;
  activeStores: number;
  totalStores: number;
};

type StoreStats = { storeId: string; storeName: string; todayRevenue: number; todayOrders: number; monthRevenue: number };
type RecentOrder = { id: string; orderNumber: string; storeName: string; status: string; finalAmount: number; pickupName: string; createdAt: string };
type TopMenu = { menuId: string; name: string; count: number; revenue: number };
type WeeklyRevenue = { date: string; revenue: number; orders: number };

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "대기", color: "#F59E0B" },
  CONFIRMED: { label: "확인", color: "#3B82F6" },
  PREPARING: { label: "제조중", color: "#8B5CF6" },
  READY: { label: "완료", color: "#10B981" },
  PICKED_UP: { label: "픽업", color: "#6B7280" },
  CANCELLED: { label: "취소", color: "#EF4444" },
};

function fmt(n: number) { return n.toLocaleString("ko-KR") + "원"; }
function pct(a: number, b: number) {
  if (b === 0) return "—";
  const v = ((a - b) / b * 100).toFixed(1);
  return (a >= b ? "▲ +" : "▼ ") + v + "%";
}

export default function HqDashboard() {
  const [stats, setStats] = useState<HqStats | null>(null);
  const [storeStats, setStoreStats] = useState<StoreStats[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topMenus, setTopMenus] = useState<TopMenu[]>([]);
  const [weekly, setWeekly] = useState<WeeklyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gbrick/hq/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setStoreStats(data.storeStats ?? []);
        setRecentOrders(data.recentOrders ?? []);
        setTopMenus(data.topMenus ?? []);
        setWeekly(data.weeklyRevenue ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 80, color: "#999" }}>로딩 중...</div>;
  if (!stats) return <div style={{ textAlign: "center", padding: 80, color: "#f00" }}>데이터를 불러올 수 없습니다.</div>;

  const maxRev = Math.max(...weekly.map((w) => w.revenue), 1);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>대시보드</h1>
        <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>GBRICK Coffee 프랜차이즈 현황 — 실시간 집계</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "오늘 매출", value: fmt(stats.today.revenue), sub: pct(stats.today.revenue, stats.yesterday.revenue), up: stats.today.revenue >= stats.yesterday.revenue },
          { label: "오늘 주문", value: stats.today.orders + "건", sub: pct(stats.today.orders, stats.yesterday.orders), up: stats.today.orders >= stats.yesterday.orders },
          { label: "신규 고객", value: stats.today.newCustomers + "명", sub: "오늘 가입", up: true },
          { label: "평균 객단가", value: fmt(stats.today.avgOrderValue), sub: "오늘 기준", up: true },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#2C1A0E" }}>{kpi.value}</div>
            <div style={{ fontSize: 12, marginTop: 6, color: kpi.up ? "#10B981" : "#EF4444" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* This Month Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "이번달 매출", value: fmt(stats.thisMonth.revenue), sub: "전월 대비 " + pct(stats.thisMonth.revenue, stats.lastMonth.revenue) },
          { label: "이번달 주문", value: stats.thisMonth.orders + "건", sub: "전월 대비 " + pct(stats.thisMonth.orders, stats.lastMonth.orders) },
          { label: "전체 고객", value: stats.totalCustomers.toLocaleString() + "명", sub: `운영 매장 ${stats.activeStores}/${stats.totalStores}` },
        ].map((item) => (
          <div key={item.label} style={{ background: "#2C1A0E", borderRadius: 12, padding: "18px 22px", color: "#fff" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{item.value}</div>
            <div style={{ fontSize: 12, marginTop: 6, color: "#C8873A" }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
        {/* Weekly Revenue Chart */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#2C1A0E", margin: "0 0 20px" }}>주간 매출 추이</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
            {weekly.map((w) => (
              <div key={w.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", background: "#C8873A", borderRadius: "4px 4px 0 0", height: (w.revenue / maxRev * 100) + "px", minHeight: 4, transition: "height 0.3s" }} />
                <div style={{ fontSize: 9, color: "#888", whiteSpace: "nowrap" }}>{w.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Menus */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#2C1A0E", margin: "0 0 16px" }}>인기 메뉴 TOP 5</h3>
          {topMenus.map((m, i) => (
            <div key={m.menuId} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, background: i === 0 ? "#C8873A" : "#f0ebe4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: i === 0 ? "#fff" : "#888" }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{m.count.toLocaleString()}잔</div>
              <div style={{ fontSize: 12, color: "#2C1A0E", fontWeight: 600 }}>{(m.revenue / 10000).toFixed(0)}만</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Store Stats */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#2C1A0E", margin: "0 0 16px" }}>매장별 오늘 현황</h3>
          {storeStats.map((s) => (
            <div key={s.storeId} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #f0ebe4" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2C1A0E" }}>{s.storeName}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{s.todayOrders}건 / 이달 {(s.monthRevenue / 10000).toFixed(0)}만원</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.todayRevenue > 0 ? "#2C1A0E" : "#ccc" }}>{s.todayRevenue > 0 ? fmt(s.todayRevenue) : "미운영"}</div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#2C1A0E", margin: "0 0 16px" }}>최근 주문</h3>
          {recentOrders.map((o) => {
            const st = STATUS_MAP[o.status] ?? { label: o.status, color: "#888" };
            const mins = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
            return (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 11, background: st.color + "22", color: st.color, padding: "2px 7px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap" }}>{st.label}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#2C1A0E" }}>{o.pickupName} · {o.storeName}</div>
                </div>
                <div style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>{mins}분 전</div>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(o.finalAmount)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
