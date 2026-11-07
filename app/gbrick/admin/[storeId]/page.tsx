"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────

interface MenuOptionRow { id: string; name: string; extraPrice: number; isDefault: boolean; groupName: string; }
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
  mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토", sun: "일",
};
interface Menu {
  id: string; categoryId: string; name: string; nameEn?: string | null;
  description?: string | null; basePrice: number; imageUrl?: string | null;
  isSignature: boolean; isNew: boolean; isSoldOut: boolean;
  storeAvailability?: { isSoldOut: boolean }[];
}
interface Category { id: string; name: string; menus: Menu[]; }
interface Store {
  id: string; name: string; phone?: string | null; address?: string;
  imageUrl?: string | null; operatingHours?: unknown; status?: string;
}

// ─── Icons ───────────────────────────────────────────────────

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#2C1A0E" : "none"} stroke={active ? "#2C1A0E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  );
}
function IconMenu({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#2C1A0E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      <circle cx="17.5" cy="17.5" r="3.5" fill={active ? "#C8873A" : "none"} stroke={active ? "#C8873A" : "#9CA3AF"}/>
    </svg>
  );
}
function IconSettings({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#2C1A0E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function OwnerAppPage() {
  const params = useParams();
  const storeId = params.storeId as string;

  const [tab, setTab] = useState<"home" | "menu" | "settings">("home");
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [hours, setHours] = useState<StoreOperatingHours>(DEFAULT_HOURS);
  const [editMenu, setEditMenu] = useState<Menu | null>(null);
  const [editForm, setEditForm] = useState({ name: "", nameEn: "", description: "", basePrice: "", imageUrl: "" });
  const [menuOptions, setMenuOptions] = useState<MenuOptionRow[]>([]);
  const [optLoading, setOptLoading] = useState(false);
  const [newOpt, setNewOpt] = useState({ groupName: "추가옵션", name: "", extraPrice: "0" });
  const [modalTab, setModalTab] = useState<"info" | "options">("info");
  const [soldOuts, setSoldOuts] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (d.store.operatingHours) setHours({ ...DEFAULT_HOURS, ...(d.store.operatingHours as StoreOperatingHours) });
      const init: Record<string, boolean> = {};
      (d.categories ?? []).forEach(cat => cat.menus.forEach(m => { init[m.id] = m.storeAvailability?.[0]?.isSoldOut ?? m.isSoldOut; }));
      setSoldOuts(init);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggleSoldOut(menuId: string) {
    const next = !soldOuts[menuId];
    setSoldOuts(p => ({ ...p, [menuId]: next }));
    try {
      await fetch(`/api/gbrick/admin/menus/${menuId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSoldOut: next, storeId }),
      });
      showToast(next ? "품절 처리됨" : "판매 재개됨");
    } catch {
      setSoldOuts(p => ({ ...p, [menuId]: !next }));
      showToast("오류가 발생했습니다");
    }
  }

  function openEdit(menu: Menu) {
    setEditMenu(menu);
    setEditForm({ name: menu.name, nameEn: menu.nameEn ?? "", description: menu.description ?? "", basePrice: String(menu.basePrice), imageUrl: menu.imageUrl ?? "" });
    setModalTab("info");
    setNewOpt({ groupName: "추가옵션", name: "", extraPrice: "0" });
    setOptLoading(true);
    fetch(`/api/gbrick/admin/menus/${menu.id}/options`, { cache: "no-store" })
      .then(r => r.json()).then(d => setMenuOptions(d.options ?? [])).catch(() => setMenuOptions([]))
      .finally(() => setOptLoading(false));
  }

  async function saveMenuEdit() {
    if (!editMenu) return;
    setSaving(true);
    try {
      await fetch(`/api/gbrick/admin/menus/${editMenu.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, nameEn: editForm.nameEn || null, description: editForm.description || null, basePrice: Number(editForm.basePrice), imageUrl: editForm.imageUrl || null }),
      });
      showToast("저장됐습니다"); setEditMenu(null); await fetchData();
    } catch { showToast("저장 실패"); } finally { setSaving(false); }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/gbrick/admin/upload", { method: "POST", body: fd });
      const d = await res.json() as { url?: string; error?: string };
      if (d.url) {
        setEditForm(p => ({ ...p, imageUrl: d.url! }));
        showToast("사진 업로드됨");
      } else {
        showToast(d.error ?? "업로드 실패");
      }
    } catch {
      showToast("업로드 실패");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAddOption() {
    if (!editMenu || !newOpt.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/gbrick/admin/menus/${editMenu.id}/options`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName: newOpt.groupName, name: newOpt.name.trim(), extraPrice: Number(newOpt.extraPrice) }),
      });
      const d = await res.json() as { option: MenuOptionRow };
      setMenuOptions(p => [...p, d.option]);
      setNewOpt(p => ({ ...p, name: "", extraPrice: "0" }));
      showToast("옵션 추가됨");
    } catch { showToast("오류 발생"); } finally { setSaving(false); }
  }

  async function handleDeleteOption(optionId: string) {
    if (!editMenu) return;
    setSaving(true);
    try {
      await fetch(`/api/gbrick/admin/menus/${editMenu.id}/options`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      setMenuOptions(p => p.filter(o => o.id !== optionId));
      showToast("삭제됨");
    } catch { showToast("오류 발생"); } finally { setSaving(false); }
  }

  async function saveHours() {
    setSaving(true);
    try {
      await fetch(`/api/gbrick/admin/stores/${storeId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatingHours: hours }),
      });
      showToast("영업시간 저장됨");
    } catch { showToast("저장 실패"); } finally { setSaving(false); }
  }

  // 오늘 영업 여부 (요일 기반)
  const todayKey = ["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()] as keyof StoreOperatingHours;
  const todayHour = hours[todayKey];
  const isOpenToday = !todayHour.closed;

  const totalMenuCount = categories.reduce((s, c) => s + c.menus.length, 0);
  const soldOutCount = Object.values(soldOuts).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3" style={{ background: "#F9F7F5" }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#2C1A0E" }}>
          <span className="text-2xl">☕</span>
        </div>
        <p className="text-sm text-stone-500">사장님 앱 로딩 중...</p>
      </div>
    );
  }

  const menus = categories.find(c => c.id === activeCat)?.menus ?? [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F9F7F5" }}>

      {/* ─── Header ─── */}
      <header style={{ background: "#2C1A0E" }} className="px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-amber-300 font-black text-lg tracking-tight">GBRICK</span>
              <span className="text-xs text-amber-200 bg-amber-900 px-2 py-0.5 rounded-full font-semibold">사장님 앱</span>
            </div>
            <h1 className="text-white font-bold text-xl">{store?.name ?? "지브릭커피"}</h1>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: isOpenToday ? "#22C55E" : "#9CA3AF" }} />
              <span className="text-xs font-semibold" style={{ color: isOpenToday ? "#86EFAC" : "#9CA3AF" }}>
                {isOpenToday ? "오늘 영업중" : "오늘 휴무"}
              </span>
            </div>
            {isOpenToday && (
              <span className="text-[11px] text-stone-400">{todayHour.open} ~ {todayHour.close}</span>
            )}
          </div>
        </div>
      </header>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "calc(70px + env(safe-area-inset-bottom))" }}>

        {/* ════ 홈 탭 ════ */}
        {tab === "home" && (
          <div className="px-4 pt-5 flex flex-col gap-4">

            {/* 오늘 현황 카드 */}
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "#2C1A0E" }}>
              <div className="px-5 pt-4 pb-3">
                <p className="text-amber-300 text-xs font-semibold mb-3">📊 오늘 현황</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-amber-200 text-xs mb-1">전체 메뉴</p>
                    <p className="text-white font-black text-2xl">{totalMenuCount}<span className="text-sm font-normal ml-1">개</span></p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-amber-200 text-xs mb-1">품절 처리</p>
                    <p className="text-white font-black text-2xl">{soldOutCount}<span className="text-sm font-normal ml-1">개</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* 빠른 실행 */}
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">빠른 실행</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "🍵", label: "메뉴 관리", sub: `총 ${totalMenuCount}개`, action: () => setTab("menu") },
                  { icon: "🚫", label: "품절 처리", sub: `${soldOutCount}개 품절 중`, action: () => setTab("menu") },
                  { icon: "🕐", label: "영업시간", sub: isOpenToday ? `${todayHour.open}~${todayHour.close}` : "오늘 휴무", action: () => setTab("settings") },
                  { icon: "📋", label: "매장 정보", sub: store?.phone ?? "전화번호 미입력", action: () => setTab("settings") },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className="bg-white rounded-2xl p-4 text-left shadow-sm border border-stone-100 active:scale-95 transition-transform">
                    <span className="text-2xl block mb-2">{item.icon}</span>
                    <p className="text-sm font-bold text-stone-800">{item.label}</p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 영업시간 요약 */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-50">
                <p className="text-xs font-bold text-stone-700">이번 주 영업시간</p>
              </div>
              <div className="px-4 py-2">
                {(Object.keys(DAY_LABELS) as (keyof StoreOperatingHours)[]).map(day => {
                  const h = hours[day];
                  const isToday = day === todayKey;
                  return (
                    <div key={day} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                      <span className="text-sm w-6 font-semibold"
                        style={{ color: day === "sun" ? "#EF4444" : day === "sat" ? "#3B82F6" : isToday ? "#2C1A0E" : "#6B7280" }}>
                        {DAY_LABELS[day]}
                        {isToday && <span className="ml-1 text-[9px] text-amber-500">오늘</span>}
                      </span>
                      <span className="text-sm" style={{ color: h.closed ? "#9CA3AF" : "#374151" }}>
                        {h.closed ? "휴무" : `${h.open} ~ ${h.close}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 매장 정보 */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 mb-2">
              <p className="text-xs font-bold text-stone-500 mb-3">매장 정보</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="text-base">🏪</span>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{store?.name}</p>
                    {store?.address && <p className="text-xs text-stone-400">{store.address}</p>}
                  </div>
                </div>
                {store?.phone && (
                  <div className="flex items-center gap-3">
                    <span className="text-base">📞</span>
                    <p className="text-sm text-stone-700">{store.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ 메뉴 탭 ════ */}
        {tab === "menu" && (
          <div className="pb-4">
            {/* 카테고리 탭 */}
            <div className="flex overflow-x-auto gap-2 px-4 py-3 bg-white border-b border-stone-100">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                  className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={{ background: activeCat === cat.id ? "#2C1A0E" : "#F5F5F4", color: activeCat === cat.id ? "#fff" : "#6B7280" }}>
                  {cat.name} <span className="opacity-60">({cat.menus.length})</span>
                </button>
              ))}
            </div>

            {/* 메뉴 리스트 */}
            <div className="px-4 pt-4 flex flex-col gap-2">
              {menus.map(menu => {
                const sold = soldOuts[menu.id] ?? false;
                return (
                  <div key={menu.id} className="bg-white rounded-xl shadow-sm border border-stone-100 p-3 flex items-center gap-3"
                    style={{ opacity: sold ? 0.6 : 1 }}>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "#F5F0EB" }}>
                      {menu.imageUrl
                        ? <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover" />
                        : <span className="text-2xl">☕</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-stone-800 truncate">{menu.name}</span>
                        {menu.isSignature && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: "#C8873A" }}>시그니처</span>}
                        {menu.isNew && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500 text-white shrink-0">NEW</span>}
                      </div>
                      {menu.description && <p className="text-xs text-stone-400 truncate">{menu.description}</p>}
                      <p className="text-sm font-bold mt-0.5" style={{ color: "#2C1A0E" }}>{menu.basePrice.toLocaleString()}원</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openEdit(menu)} className="p-2 rounded-lg text-stone-500" style={{ background: "#F5F0EB" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <div className="flex flex-col items-center gap-0.5">
                        <button onClick={() => toggleSoldOut(menu.id)}
                          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                          style={{ background: sold ? "#EF4444" : "#D1D5DB" }}>
                          <span className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                            style={{ transform: sold ? "translateX(24px)" : "translateX(2px)" }} />
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

        {/* ════ 설정 탭 ════ */}
        {tab === "settings" && (
          <div className="px-4 pt-5 flex flex-col gap-5 pb-4">

            {/* 영업시간 */}
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">영업시간</p>
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                {(Object.keys(DAY_LABELS) as (keyof StoreOperatingHours)[]).map((day, idx) => {
                  const h = hours[day];
                  const isToday = day === todayKey;
                  return (
                    <div key={day} className="px-4 py-3 flex items-center gap-3"
                      style={{ borderTop: idx > 0 ? "1px solid #F3F4F6" : "none", background: isToday ? "#FFFBF7" : "transparent" }}>
                      <span className="text-sm font-bold w-8 shrink-0"
                        style={{ color: day === "sun" ? "#EF4444" : day === "sat" ? "#3B82F6" : isToday ? "#C8873A" : "#374151" }}>
                        {DAY_LABELS[day]}{isToday && "·"}
                      </span>
                      {h.closed ? (
                        <span className="text-sm text-stone-400 flex-1">휴무일</span>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={h.open}
                            onChange={e => setHours(p => ({ ...p, [day]: { ...p[day], open: e.target.value } }))}
                            className="text-sm border border-stone-200 rounded-lg px-2 py-1 w-24" />
                          <span className="text-stone-400">~</span>
                          <input type="time" value={h.close}
                            onChange={e => setHours(p => ({ ...p, [day]: { ...p[day], close: e.target.value } }))}
                            className="text-sm border border-stone-200 rounded-lg px-2 py-1 w-24" />
                        </div>
                      )}
                      <button onClick={() => setHours(p => ({ ...p, [day]: { ...p[day], closed: !p[day].closed } }))}
                        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
                        style={{ background: h.closed ? "#2C1A0E" : "#D1D5DB" }}>
                        <span className="inline-block h-3 w-3 rounded-full bg-white shadow transition-transform"
                          style={{ transform: h.closed ? "translateX(18px)" : "translateX(2px)" }} />
                      </button>
                      <span className="text-[10px] text-stone-400 shrink-0 w-6">{h.closed ? "휴무" : "영업"}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={saveHours} disabled={saving}
                className="w-full mt-3 py-3.5 rounded-xl text-white font-bold text-sm"
                style={{ background: saving ? "#9CA3AF" : "#2C1A0E" }}>
                {saving ? "저장 중..." : "영업시간 저장"}
              </button>
            </div>

            {/* 매장 정보 */}
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">매장 정보</p>
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
                <div>
                  <p className="text-xs text-stone-400 mb-0.5">매장 ID</p>
                  <p className="text-sm font-mono text-stone-600 break-all">{store?.id}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 mb-0.5">매장명</p>
                  <p className="text-sm font-semibold text-stone-800">{store?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 mb-0.5">전화번호</p>
                  <p className="text-sm text-stone-700">{store?.phone ?? "미입력"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Nav ─── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-stone-100"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex">
          {([
            { key: "home", label: "홈", Icon: IconHome },
            { key: "menu", label: "메뉴", Icon: IconMenu },
            { key: "settings", label: "설정", Icon: IconSettings },
          ] as const).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)} className="flex-1 flex flex-col items-center py-3 gap-1">
              <Icon active={tab === key} />
              <span className="text-[11px] font-semibold"
                style={{ color: tab === key ? "#2C1A0E" : "#9CA3AF" }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Menu Edit Modal ─── */}
      {editMenu && (
        <div className="fixed inset-0 z-[300] flex items-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setEditMenu(null)}>
          <div className="w-full max-w-[480px] mx-auto bg-white rounded-t-3xl pt-5 overflow-hidden"
            style={{ maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
            <h3 className="font-bold text-base text-stone-800 mb-3 px-5">{editMenu.name}</h3>
            <div className="flex border-b border-stone-100 px-5 gap-4 mb-4">
              {(["info", "options"] as const).map(t => (
                <button key={t} onClick={() => setModalTab(t)}
                  className="pb-2 text-sm font-semibold transition-colors"
                  style={{ color: modalTab === t ? "#2C1A0E" : "#9CA3AF", borderBottom: modalTab === t ? "2px solid #C8873A" : "2px solid transparent" }}>
                  {t === "info" ? "메뉴 정보" : "옵션 관리"}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto px-5" style={{ maxHeight: "calc(90vh - 160px)", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
              {modalTab === "info" && (
                <div className="space-y-3">
                  {/* 메뉴 사진 */}
                  <div>
                    <label className="text-xs font-semibold text-stone-600">메뉴 사진</label>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <div className="mt-1">
                      {editForm.imageUrl ? (
                        <div className="relative rounded-xl overflow-hidden">
                          <img src={editForm.imageUrl} alt="메뉴 사진" className="w-full h-44 object-cover" />
                          <div className="absolute inset-0 flex items-end gap-2 p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }}>
                            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                              className="flex-1 py-2 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1.5"
                              style={{ background: "rgba(200,135,58,0.9)" }}>
                              📷 {uploading ? "업로드 중..." : "사진 변경"}
                            </button>
                            <button onClick={() => setEditForm(p => ({ ...p, imageUrl: "" }))}
                              className="py-2 px-3 rounded-lg text-white text-xs font-bold"
                              style={{ background: "rgba(239,68,68,0.85)" }}>
                              삭제
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                          className="w-full h-36 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors"
                          style={{ background: uploading ? "#F5F5F4" : "#FAFAF9" }}>
                          {uploading ? (
                            <>
                              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs text-amber-500 font-semibold">업로드 중...</span>
                            </>
                          ) : (
                            <>
                              <span className="text-3xl">📷</span>
                              <span className="text-sm font-semibold text-stone-500">사진 추가</span>
                              <span className="text-xs text-stone-400">갤러리에서 선택</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {[
                    { label: "메뉴명 *", key: "name", placeholder: "메뉴 이름", type: "text" },
                    { label: "영문명", key: "nameEn", placeholder: "English name", type: "text" },
                    { label: "가격 (원) *", key: "basePrice", placeholder: "0", type: "number" },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-xs font-semibold text-stone-600">{field.label}</label>
                      <input type={field.type} value={editForm[field.key as keyof typeof editForm]}
                        onChange={e => setEditForm(p => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full mt-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm"
                        placeholder={field.placeholder} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold text-stone-600">설명</label>
                    <textarea value={editForm.description}
                      onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full mt-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm resize-none" rows={2} placeholder="메뉴 설명" />
                  </div>
                  <button onClick={saveMenuEdit} disabled={saving || uploading || !editForm.name || !editForm.basePrice}
                    className="w-full mt-2 py-3.5 rounded-xl text-white font-bold text-sm"
                    style={{ background: (saving || uploading) ? "#9CA3AF" : "#C8873A" }}>
                    {saving ? "저장 중..." : "저장"}
                  </button>
                </div>
              )}
              {modalTab === "options" && (
                <div>
                  {optLoading ? (
                    <p className="text-xs text-stone-400 text-center py-4">불러오는 중...</p>
                  ) : menuOptions.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-4">등록된 옵션이 없습니다</p>
                  ) : (
                    <div className="mb-4">
                      {Object.entries(menuOptions.reduce<Record<string, MenuOptionRow[]>>((acc, o) => {
                        const g = o.groupName || "기타"; if (!acc[g]) acc[g] = []; acc[g].push(o); return acc;
                      }, {})).map(([group, opts]) => (
                        <div key={group} className="mb-3">
                          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1.5">{group}</p>
                          {opts.map(opt => (
                            <div key={opt.id} className="flex items-center justify-between bg-stone-50 rounded-xl px-3 py-2.5 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-stone-800">{opt.name}</span>
                                {opt.isDefault && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">기본</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold" style={{ color: "#C8873A" }}>{opt.extraPrice > 0 ? `+${opt.extraPrice.toLocaleString()}원` : "무료"}</span>
                                <button onClick={() => handleDeleteOption(opt.id)} className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold">✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="bg-stone-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-stone-600 mb-3">새 옵션 추가</p>
                    <div className="mb-2">
                      <label className="text-[11px] text-stone-500 font-semibold">그룹</label>
                      <select value={newOpt.groupName} onChange={e => setNewOpt(p => ({ ...p, groupName: e.target.value }))}
                        className="w-full mt-1 text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white">
                        <option value="추가옵션">추가옵션</option>
                        <option value="온도">온도</option>
                        <option value="사이즈">사이즈</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1">
                        <label className="text-[11px] text-stone-500 font-semibold">옵션명</label>
                        <input value={newOpt.name} onChange={e => setNewOpt(p => ({ ...p, name: e.target.value }))}
                          placeholder="예: 바닐라시럽"
                          className="w-full mt-1 text-sm border border-stone-200 rounded-xl px-3 py-2" />
                      </div>
                      <div className="w-24">
                        <label className="text-[11px] text-stone-500 font-semibold">추가금액</label>
                        <input type="number" value={newOpt.extraPrice} onChange={e => setNewOpt(p => ({ ...p, extraPrice: e.target.value }))}
                          placeholder="0" className="w-full mt-1 text-sm border border-stone-200 rounded-xl px-3 py-2" />
                      </div>
                    </div>
                    <button onClick={handleAddOption} disabled={saving || !newOpt.name.trim()}
                      className="w-full py-3 rounded-xl text-white font-bold text-sm"
                      style={{ background: saving || !newOpt.name.trim() ? "#9CA3AF" : "#2C1A0E" }}>
                      {saving ? "처리 중..." : "옵션 추가"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[400] px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg"
          style={{ background: "#2C1A0E", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
