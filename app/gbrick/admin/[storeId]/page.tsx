"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────

interface OperatingHour { open: string; close: string; closed: boolean; }
interface StoreOperatingHours {
  mon: OperatingHour; tue: OperatingHour; wed: OperatingHour;
  thu: OperatingHour; fri: OperatingHour; sat: OperatingHour; sun: OperatingHour;
}

const DEFAULT_HOURS: StoreOperatingHours = {
  mon: { open: "09:00", close: "21:00", closed: false },
  tue: { open: "09:00", close: "21:00", closed: false },
  wed: { open: "09:00", close: "21:00", closed: false },
  thu: { open: "09:00", close: "21:00", closed: false },
  fri: { open: "09:00", close: "21:00", closed: false },
  sat: { open: "09:00", close: "21:00", closed: false },
  sun: { open: "09:00", close: "21:00", closed: true },
};

const DAY_LABELS: Record<string, string> = {
  mon: "월요일", tue: "화요일", wed: "수요일",
  thu: "목요일", fri: "금요일", sat: "토요일", sun: "일요일",
};

interface Menu {
  id: string; categoryId: string; name: string; nameEn?: string | null;
  description?: string | null; basePrice: number; imageUrl?: string | null;
  isSignature: boolean; isNew: boolean; isSoldOut: boolean;
  storeAvailability?: { isSoldOut: boolean }[];
}
interface Category { id: string; name: string; menus: Menu[]; }
interface Store {
  id: string; name: string; phone?: string | null;
  imageUrl?: string | null; operatingHours?: unknown;
}

// ─── Main Page ───────────────────────────────────────────────

export default function AdminPage() {
  const params = useParams();
  const storeId = params.storeId as string;

  const [tab, setTab] = useState<"menu" | "hours" | "info">("menu");
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [hours, setHours] = useState<StoreOperatingHours>(DEFAULT_HOURS);
  const [editMenu, setEditMenu] = useState<Menu | null>(null);
  const [editForm, setEditForm] = useState({ name: "", nameEn: "", description: "", basePrice: "", imageUrl: "" });

  // sold-out 로컬 상태 (storeId별 오버라이드)
  const [soldOuts, setSoldOuts] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gbrick/admin/stores/${storeId}`, { cache: "no-store" });
      const d = await res.json() as { store: Store; categories: Category[] };
      setStore(d.store);
      setCategories(d.categories ?? []);
      if (d.categories?.[0]) setActiveCat(d.categories[0].id);
      if (d.store.operatingHours) {
        setHours({ ...DEFAULT_HOURS, ...(d.store.operatingHours as StoreOperatingHours) });
      }
      // 초기 품절 상태
      const init: Record<string, boolean> = {};
      (d.categories ?? []).forEach((cat) =>
        cat.menus.forEach((m) => {
          init[m.id] = m.storeAvailability?.[0]?.isSoldOut ?? m.isSoldOut;
        })
      );
      setSoldOuts(init);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Sold-out toggle ────────────────────────────────────────
  async function toggleSoldOut(menuId: string) {
    const next = !soldOuts[menuId];
    setSoldOuts((p) => ({ ...p, [menuId]: next }));
    try {
      await fetch(`/api/gbrick/admin/menus/${menuId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSoldOut: next, storeId }),
      });
      showToast(next ? "품절 처리됨" : "판매 재개됨");
    } catch {
      setSoldOuts((p) => ({ ...p, [menuId]: !next }));
      showToast("오류가 발생했습니다");
    }
  }

  // ─── Menu edit ──────────────────────────────────────────────
  function openEdit(menu: Menu) {
    setEditMenu(menu);
    setEditForm({
      name: menu.name,
      nameEn: menu.nameEn ?? "",
      description: menu.description ?? "",
      basePrice: String(menu.basePrice),
      imageUrl: menu.imageUrl ?? "",
    });
  }

  async function saveMenuEdit() {
    if (!editMenu) return;
    setSaving(true);
    try {
      await fetch(`/api/gbrick/admin/menus/${editMenu.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          nameEn: editForm.nameEn || null,
          description: editForm.description || null,
          basePrice: Number(editForm.basePrice),
          imageUrl: editForm.imageUrl || null,
        }),
      });
      showToast("메뉴 정보가 저장되었습니다");
      setEditMenu(null);
      await fetchData();
    } catch {
      showToast("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  // ─── Hours save ─────────────────────────────────────────────
  async function saveHours() {
    setSaving(true);
    try {
      await fetch(`/api/gbrick/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatingHours: hours }),
      });
      showToast("영업시간이 저장되었습니다");
    } catch {
      showToast("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#F9F7F5" }}>
        <p className="text-stone-400">불러오는 중...</p>
      </div>
    );
  }

  const menus = categories.find((c) => c.id === activeCat)?.menus ?? [];

  return (
    <div className="min-h-screen" style={{ background: "#F9F7F5" }}>
      {/* Header */}
      <header style={{ background: "#2C1A0E" }} className="px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-amber-300 text-xs font-medium">매장 관리</p>
          <h1 className="text-white font-bold text-lg">{store?.name ?? "지브릭커피"}</h1>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-full font-semibold"
          style={{ background: "#C8873A", color: "#fff" }}
        >
          관리자
        </div>
      </header>

      {/* Tab nav */}
      <div className="flex border-b border-stone-200 bg-white">
        {(["menu", "hours", "info"] as const).map((t) => {
          const labels = { menu: "메뉴 관리", hours: "영업시간", info: "매장 정보" };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3 text-sm font-semibold transition-colors"
              style={{
                color: tab === t ? "#2C1A0E" : "#9CA3AF",
                borderBottom: tab === t ? "2px solid #C8873A" : "2px solid transparent",
              }}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ─── Menu Tab ─── */}
      {tab === "menu" && (
        <div className="pb-10">
          {/* Category tabs */}
          <div className="flex overflow-x-auto gap-2 px-4 py-3 bg-white border-b border-stone-100">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  background: activeCat === cat.id ? "#2C1A0E" : "#F5F5F4",
                  color: activeCat === cat.id ? "#fff" : "#6B7280",
                }}
              >
                {cat.name} <span className="opacity-60">({cat.menus.length})</span>
              </button>
            ))}
          </div>

          {/* Menu list */}
          <div className="px-4 pt-4 flex flex-col gap-2">
            {menus.map((menu) => {
              const sold = soldOuts[menu.id] ?? false;
              return (
                <div
                  key={menu.id}
                  className="bg-white rounded-xl shadow-sm border border-stone-100 p-3 flex items-center gap-3"
                  style={{ opacity: sold ? 0.6 : 1 }}
                >
                  {/* Thumb */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: "#F5F0EB" }}
                  >
                    {menu.imageUrl
                      ? <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover" />
                      : <span className="text-2xl">☕</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-stone-800 truncate">{menu.name}</span>
                      {menu.isSignature && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: "#C8873A" }}>시그니처</span>
                      )}
                      {menu.isNew && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500 text-white shrink-0">NEW</span>
                      )}
                    </div>
                    {menu.description && (
                      <p className="text-xs text-stone-400 truncate">{menu.description}</p>
                    )}
                    <p className="text-sm font-bold mt-0.5" style={{ color: "#2C1A0E" }}>
                      {menu.basePrice.toLocaleString()}원
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Edit button */}
                    <button
                      onClick={() => openEdit(menu)}
                      className="p-2 rounded-lg text-stone-500"
                      style={{ background: "#F5F0EB" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>

                    {/* Sold-out toggle */}
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => toggleSoldOut(menu.id)}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                        style={{ background: sold ? "#EF4444" : "#D1D5DB" }}
                      >
                        <span
                          className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                          style={{ transform: sold ? "translateX(24px)" : "translateX(2px)" }}
                        />
                      </button>
                      <span className="text-[10px]" style={{ color: sold ? "#EF4444" : "#9CA3AF" }}>
                        {sold ? "품절" : "판매중"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Hours Tab ─── */}
      {tab === "hours" && (
        <div className="px-4 pt-4 pb-10">
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
            {(Object.keys(DAY_LABELS) as (keyof StoreOperatingHours)[]).map((day, idx) => {
              const h = hours[day];
              return (
                <div
                  key={day}
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ borderTop: idx > 0 ? "1px solid #F3F4F6" : "none" }}
                >
                  <span className="text-sm font-semibold w-14 shrink-0" style={{ color: day === "sun" ? "#EF4444" : day === "sat" ? "#3B82F6" : "#374151" }}>
                    {DAY_LABELS[day]}
                  </span>
                  {h.closed ? (
                    <span className="text-sm text-stone-400 flex-1">휴무</span>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => setHours((p) => ({ ...p, [day]: { ...p[day], open: e.target.value } }))}
                        className="text-sm border border-stone-200 rounded-lg px-2 py-1 w-24"
                      />
                      <span className="text-stone-400 text-sm">~</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => setHours((p) => ({ ...p, [day]: { ...p[day], close: e.target.value } }))}
                        className="text-sm border border-stone-200 rounded-lg px-2 py-1 w-24"
                      />
                    </div>
                  )}
                  {/* Closed toggle */}
                  <button
                    onClick={() => setHours((p) => ({ ...p, [day]: { ...p[day], closed: !p[day].closed } }))}
                    className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
                    style={{ background: h.closed ? "#2C1A0E" : "#D1D5DB" }}
                  >
                    <span
                      className="inline-block h-3 w-3 rounded-full bg-white shadow transition-transform"
                      style={{ transform: h.closed ? "translateX(18px)" : "translateX(2px)" }}
                    />
                  </button>
                  <span className="text-[10px] text-stone-400 shrink-0 w-7">{h.closed ? "휴무" : "영업"}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={saveHours}
            disabled={saving}
            className="w-full mt-5 py-3.5 rounded-xl text-white font-bold text-sm"
            style={{ background: saving ? "#9CA3AF" : "#2C1A0E" }}
          >
            {saving ? "저장 중..." : "영업시간 저장"}
          </button>
        </div>
      )}

      {/* ─── Info Tab ─── */}
      {tab === "info" && (
        <div className="px-4 pt-4 pb-10">
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 space-y-3">
            <div>
              <p className="text-xs text-stone-500 mb-1">매장 ID</p>
              <p className="text-sm font-mono text-stone-700">{store?.id}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-1">매장명</p>
              <p className="text-sm font-semibold text-stone-800">{store?.name}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-1">전화번호</p>
              <p className="text-sm text-stone-700">{store?.phone ?? "미입력"}</p>
            </div>
          </div>

          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-800 mb-1">메뉴 옵션 일괄 등록 SQL</p>
            <p className="text-xs text-amber-700">
              Supabase SQL Editor에서 아래 SQL을 실행하면 옵션 없는 모든 메뉴에 추가옵션·온도를 일괄 추가합니다.
            </p>
            <p className="text-xs text-amber-600 mt-2 font-mono break-all">
              /api/gbrick/admin/stores/{store?.id}
            </p>
          </div>
        </div>
      )}

      {/* ─── Menu Edit Modal ─── */}
      {editMenu && (
        <div
          className="fixed inset-0 z-[300] flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setEditMenu(null)}
        >
          <div
            className="w-full max-w-[480px] mx-auto bg-white rounded-t-3xl px-5 pt-6"
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
            <h3 className="font-bold text-base text-stone-800 mb-4">메뉴 수정</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-600">메뉴명 *</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm"
                  placeholder="메뉴 이름"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">영문명</label>
                <input
                  value={editForm.nameEn}
                  onChange={(e) => setEditForm((p) => ({ ...p, nameEn: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm"
                  placeholder="English name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">설명</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm resize-none"
                  rows={2}
                  placeholder="메뉴 설명"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">가격 (원) *</label>
                <input
                  type="number"
                  value={editForm.basePrice}
                  onChange={(e) => setEditForm((p) => ({ ...p, basePrice: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">이미지 URL</label>
                <input
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm((p) => ({ ...p, imageUrl: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>

            <button
              onClick={saveMenuEdit}
              disabled={saving || !editForm.name || !editForm.basePrice}
              className="w-full mt-5 py-3.5 rounded-xl text-white font-bold text-sm"
              style={{ background: saving ? "#9CA3AF" : "#C8873A" }}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[400] px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg"
          style={{ background: "#2C1A0E", whiteSpace: "nowrap" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
