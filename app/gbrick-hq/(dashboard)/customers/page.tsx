"use client";

import { useEffect, useState } from "react";

type Customer = { id: string; nickname: string; email: string; phone: string; pointBalance: number; totalOrders: number; totalSpent: number; joinedAt: string; lastOrderAt: string };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (search: string) => {
    setLoading(true);
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    fetch(`/api/gbrick/hq/customers${params}`)
      .then((r) => r.json())
      .then((d) => { setCustomers(d.customers ?? []); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(""); }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>고객 관리</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>총 {total}명</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q)}
          placeholder="이름·이메일·전화번호 검색"
          style={{ flex: 1, maxWidth: 320, border: "1px solid #e0d9d0", borderRadius: 8, padding: "9px 14px", fontSize: 13, outline: "none" }}
        />
        <button onClick={() => load(q)} style={{ background: "#2C1A0E", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, cursor: "pointer" }}>검색</button>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8f7f5", borderBottom: "1px solid #e8e0d8" }}>
              {["이름", "이메일", "전화번호", "포인트", "주문 수", "총 결제", "마지막 주문"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#666", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#999" }}>로딩 중...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>고객 없음</td></tr>
            ) : customers.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f0ebe4", background: i % 2 === 0 ? "#fff" : "#fdfcfb" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600 }}>{c.nickname}</td>
                <td style={{ padding: "12px 16px", color: "#888", fontSize: 12 }}>{c.email}</td>
                <td style={{ padding: "12px 16px", color: "#888", fontSize: 12 }}>{c.phone}</td>
                <td style={{ padding: "12px 16px", color: "#C8873A", fontWeight: 600 }}>{c.pointBalance.toLocaleString()}P</td>
                <td style={{ padding: "12px 16px" }}>{c.totalOrders}건</td>
                <td style={{ padding: "12px 16px", fontWeight: 600 }}>{c.totalSpent.toLocaleString()}원</td>
                <td style={{ padding: "12px 16px", color: "#888", fontSize: 12 }}>{c.lastOrderAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
