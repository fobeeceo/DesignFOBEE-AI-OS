"use client";

import { useState } from "react";
import { MOCK_CUSTOMERS } from "@/lib/gbrick/mockData";

export default function PointsPage() {
  const [q, setQ] = useState("");
  const filtered = q
    ? MOCK_CUSTOMERS.filter((c) => c.nickname.includes(q) || c.email.includes(q))
    : MOCK_CUSTOMERS;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>포인트 관리</h1>
        <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>고객 포인트 현황 및 조정</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "총 발행 포인트", value: MOCK_CUSTOMERS.reduce((a, c) => a + c.pointBalance, 0).toLocaleString() + "P" },
          { label: "포인트 보유 고객", value: MOCK_CUSTOMERS.filter((c) => c.pointBalance > 0).length + "명" },
          { label: "기본 적립율", value: "3%" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#C8873A" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="고객 검색" style={{ flex: 1, maxWidth: 280, border: "1px solid #e0d9d0", borderRadius: 8, padding: "9px 14px", fontSize: 13 }} />
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8f7f5", borderBottom: "1px solid #e8e0d8" }}>
              {["고객명", "이메일", "보유 포인트", "총 주문", "포인트 조정"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#666", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f0ebe4", background: i % 2 === 0 ? "#fff" : "#fdfcfb" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600 }}>{c.nickname}</td>
                <td style={{ padding: "12px 16px", color: "#888", fontSize: 12 }}>{c.email}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#C8873A", fontSize: 15 }}>{c.pointBalance.toLocaleString()}P</td>
                <td style={{ padding: "12px 16px" }}>{c.totalOrders}건</td>
                <td style={{ padding: "12px 16px" }}>
                  <button style={{ background: "#f0ebe4", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer", color: "#666" }}>조정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, padding: "12px 16px", background: "#fff8f0", borderRadius: 8, fontSize: 12, color: "#C8873A" }}>
        ℹ️ 포인트 조정 기능은 DB 연결 후 활성화됩니다.
      </div>
    </div>
  );
}
