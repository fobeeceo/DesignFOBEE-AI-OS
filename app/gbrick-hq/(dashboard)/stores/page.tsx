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

const FORM_INIT = { code: "", name: "", address: "", phone: "", pointRate: "3", stampGoal: "10" };

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_INIT);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function fetchStores() {
    setLoading(true);
    fetch("/api/gbrick/hq/stores")
      .then((r) => r.json())
      .then((d) => setStores(d.stores ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchStores(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setFormError("");
    try {
      const res = await fetch("/api/gbrick/hq/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          address: form.address,
          phone: form.phone,
          pointRate: parseFloat(form.pointRate) / 100,
          stampGoal: parseInt(form.stampGoal),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "등록 실패");
      setForm(FORM_INIT); setShowForm(false); fetchStores();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "오류");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "#999" }}>로딩 중...</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>매장 관리</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>전체 {stores.length}개 매장</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: "#C8873A", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
        >
          {showForm ? "취소" : "+ 매장 추가"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f0ebe4", display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>새 매장 등록</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { key: "code", label: "매장 코드 *", placeholder: "GBR-001" },
              { key: "name", label: "매장명 *", placeholder: "지브릭커피 신촌점" },
              { key: "address", label: "주소 *", placeholder: "서울 서대문구..." },
              { key: "phone", label: "전화번호", placeholder: "02-517-1474" },
              { key: "pointRate", label: "포인트율 (%)", placeholder: "3" },
              { key: "stampGoal", label: "스탬프 목표", placeholder: "10" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required={["code", "name", "address"].includes(key)}
                  style={{ width: "100%", border: "1px solid #e0d9d0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
          </div>
          {formError && <div style={{ fontSize: 12, color: "#EF4444" }}>{formError}</div>}
          <button
            type="submit"
            disabled={submitting}
            style={{ background: "#2C1A0E", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, cursor: "pointer", fontSize: 14, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "등록 중..." : "매장 등록"}
          </button>
        </form>
      )}

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
