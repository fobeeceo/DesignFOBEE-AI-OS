"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string; nameEn: string; sortOrder: number };
type Menu = { id: string; categoryId: string; name: string; nameEn: string; description: string; basePrice: number; isSignature: boolean; isNew: boolean; isSoldOut: boolean; tags: string[] };

export default function MenusPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gbrick/hq/menus")
      .then((r) => r.json())
      .then((d) => { setCategories(d.categories ?? []); setMenus(d.menus ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === "all" ? menus : menus.filter((m) => m.categoryId === activeCategory);

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "#999" }}>로딩 중...</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>메뉴 관리</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>전체 {menus.length}개 메뉴</p>
        </div>
        <button style={{ background: "#C8873A", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
          + 메뉴 추가
        </button>
      </div>

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
