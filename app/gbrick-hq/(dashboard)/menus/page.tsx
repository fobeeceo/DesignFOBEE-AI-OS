"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string; nameEn: string; sortOrder: number };
type Menu = { id: string; categoryId: string; name: string; nameEn: string; description: string; basePrice: number; isSignature: boolean; isNew: boolean; isSoldOut: boolean; tags: string[] };

const MENU_INIT = { categoryId: "", name: "", nameEn: "", description: "", basePrice: "", isSignature: false, isNew: false };

export default function MenusPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(MENU_INIT);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function fetchMenus() {
    setLoading(true);
    fetch("/api/gbrick/hq/menus")
      .then((r) => r.json())
      .then((d) => { setCategories(d.categories ?? []); setMenus(d.menus ?? []); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchMenus(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setFormError("");
    try {
      const res = await fetch("/api/gbrick/hq/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: form.categoryId,
          name: form.name,
          nameEn: form.nameEn,
          description: form.description,
          basePrice: parseInt(form.basePrice),
          isSignature: form.isSignature,
          isNew: form.isNew,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "등록 실패");
      setForm(MENU_INIT); setShowForm(false); fetchMenus();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "오류");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = activeCategory === "all" ? menus : menus.filter((m) => m.categoryId === activeCategory);

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "#999" }}>로딩 중...</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>메뉴 관리</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>전체 {menus.length}개 메뉴</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: "#C8873A", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
        >
          {showForm ? "취소" : "+ 메뉴 추가"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f0ebe4", display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>새 메뉴 추가</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>카테고리 *</div>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                required
                style={{ width: "100%", border: "1px solid #e0d9d0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
              >
                <option value="">선택하세요</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {[
              { key: "name", label: "메뉴명 *", placeholder: "지브릭 라떼" },
              { key: "nameEn", label: "영문명", placeholder: "GBRICK Latte" },
              { key: "basePrice", label: "가격 *", placeholder: "6500" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
                <input
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required={["name", "basePrice"].includes(key)}
                  type={key === "basePrice" ? "number" : "text"}
                  style={{ width: "100%", border: "1px solid #e0d9d0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>설명</div>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="메뉴 설명을 입력하세요"
                rows={2}
                style={{ width: "100%", border: "1px solid #e0d9d0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={form.isSignature} onChange={(e) => setForm((p) => ({ ...p, isSignature: e.target.checked }))} />
                시그니처
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={form.isNew} onChange={(e) => setForm((p) => ({ ...p, isNew: e.target.checked }))} />
                신메뉴
              </label>
            </div>
          </div>
          {formError && <div style={{ fontSize: 12, color: "#EF4444" }}>{formError}</div>}
          <button
            type="submit"
            disabled={submitting}
            style={{ background: "#2C1A0E", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, cursor: "pointer", fontSize: 14, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "등록 중..." : "메뉴 등록"}
          </button>
        </form>
      )}

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[{ id: "all", name: "전체" }, ...categories].map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            style={{ padding: "7px 16px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 500, cursor: "pointer", borderColor: activeCategory === c.id ? "#C8873A" : "#e0d9d0", background: activeCategory === c.id ? "#C8873A" : "#fff", color: activeCategory === c.id ? "#fff" : "#666", transition: "all 0.15s" }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {filtered.map((m) => (
          <div key={m.id} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f0ebe4", opacity: m.isSoldOut ? 0.6 : 1 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {m.isSignature && <span style={{ fontSize: 10, background: "#C8873A22", color: "#C8873A", padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>시그니처</span>}
              {m.isNew && <span style={{ fontSize: 10, background: "#10B98122", color: "#10B981", padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>NEW</span>}
              {m.isSoldOut && <span style={{ fontSize: 10, background: "#EF444422", color: "#EF4444", padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>품절</span>}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginBottom: 4 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>{m.nameEn}</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 12, lineHeight: 1.5 }}>{m.description}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#C8873A" }}>{m.basePrice.toLocaleString()}원</div>
              <button style={{ background: "#f0ebe4", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer", color: "#666" }}>수정</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
