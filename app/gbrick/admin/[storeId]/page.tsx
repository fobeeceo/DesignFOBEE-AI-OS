"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

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
  sortOrder?: number | null;
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
function IconOrders({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#2C1A0E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="2"/>
      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  );
}

// ─── Order Types ─────────────────────────────────────────────
interface OrderItem { menuName: string; quantity: number; unitPrice: number; }
interface OrderRow {
  id: string; orderNumber: string; status: string;
  finalAmount: number; pickupName?: string | null; note?: string | null;
  createdAt: string; items?: OrderItem[];
}

const ORDER_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "대기중",   color: "#F59E0B" },
  CONFIRMED: { label: "접수됨",   color: "#3B82F6" },
  PREPARING: { label: "준비중",   color: "#8B5CF6" },
  READY:     { label: "준비완료", color: "#10B981" },
  PICKED_UP: { label: "픽업완료", color: "#6B7280" },
  CANCELLED: { label: "취소됨",   color: "#EF4444" },
};

// 배민/쿠팡 방식: 접수 → 조리완료 → 픽업완료 (3단계)
const NEXT_STATUS: Record<string, { action: string; next: string; btnColor: string }> = {
  PENDING:   { action: "🔔 접수",    next: "CONFIRMED",  btnColor: "#F59E0B" },
  CONFIRMED: { action: "☕ 조리완료", next: "READY",      btnColor: "#8B5CF6" },
  PREPARING: { action: "☕ 조리완료", next: "READY",      btnColor: "#8B5CF6" },
  READY:     { action: "✅ 픽업완료", next: "PICKED_UP",  btnColor: "#10B981" },
};

// ─── Sound & Notification ────────────────────────────────────
function playOrderBell() {
  try {
    type AudioCtxCtor = typeof AudioContext;
    const Ctx: AudioCtxCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: AudioCtxCtor }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [[660, 0], [880, 0.18], [660, 0.36]].forEach(([freq, when]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.3);
      osc.start(ctx.currentTime + when); osc.stop(ctx.currentTime + when + 0.35);
    });
    setTimeout(() => { try { ctx.close(); } catch {} }, 2000);
  } catch { /* 소리 없음 */ }
}

function sendNewOrderNotif(storeName: string, count: number) {
  playOrderBell();
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (Notification as any)(`🔔 새 주문 ${count}건`, {
    body: `${storeName}에 새 주문이 들어왔습니다`,
    tag: "gbrick-new-order",
    renotify: true,
  });
}

// ─── Kitchen Ticket Printer ───────────────────────────────────
function printKitchenTicket(order: OrderRow, storeName: string) {
  const time = new Date(order.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const shortNum = order.orderNumber.slice(-6).toUpperCase();
  const rows = (order.items ?? []).map(i =>
    `<tr>
      <td class="name">${i.menuName}</td>
      <td class="qty">×${i.quantity}</td>
    </tr>`
  ).join("");

  const html = `<!DOCTYPE html><html lang="ko"><head>
<meta charset="utf-8">
<title>주방빌지 ${shortNum}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Courier New',Courier,monospace;width:72mm;padding:3mm 4mm;font-size:13px;color:#000;}
  .brand{text-align:center;font-size:17px;font-weight:900;letter-spacing:3px;margin-bottom:2px;}
  .sub{text-align:center;font-size:11px;color:#444;margin-bottom:6px;}
  .dash{border-top:2px dashed #000;margin:5px 0;}
  .num{font-size:30px;font-weight:900;letter-spacing:1px;margin:4px 0 2px;}
  .pickup{font-size:22px;font-weight:900;margin-bottom:4px;}
  table{width:100%;border-collapse:collapse;margin:6px 0;}
  td.name{font-size:17px;font-weight:700;padding:3px 0;}
  td.qty{font-size:20px;font-weight:900;text-align:right;padding:3px 0;}
  .note{font-size:14px;font-weight:700;padding:4px 0;background:#f0f0f0;}
  .total{font-size:14px;font-weight:bold;text-align:right;padding-top:4px;}
  @media print{body{width:auto;}}
</style></head><body>
<div class="brand">GBRICK COFFEE</div>
<div class="sub">${storeName} · ${time}</div>
<div class="dash"></div>
<div class="num">#${shortNum}</div>
<div class="pickup">👤 ${order.pickupName ?? "손님"}</div>
<div class="dash"></div>
<table>${rows}</table>
<div class="dash"></div>
${order.note ? `<div class="note">📝 메모: ${order.note}</div><div class="dash"></div>` : ""}
<div class="total">${order.finalAmount.toLocaleString()}원</div>
<script>window.onload=function(){window.print();setTimeout(function(){window.close();},800);}</script>
</body></html>`;

  const win = window.open("", "_blank", "width=380,height=550,left=50,top=50");
  if (win) { win.document.write(html); win.document.close(); }
  else { alert("팝업이 차단됐습니다.\n브라우저 주소창 옆 팝업 허용 버튼을 눌러주세요."); }
}

// ─── Main Page ───────────────────────────────────────────────

export default function OwnerAppPage() {
  const params = useParams();
  const router = useRouter();
  const rawStoreId = params.storeId as string;
  // "[storeId]"가 URL에 그대로 들어오면 (북마크/직접접근) 인덱스 페이지로 이동
  const storeId = (rawStoreId === "%5BstoreId%5D" || rawStoreId?.startsWith("["))
    ? "gbrick-esp-001"
    : rawStoreId;

  const [tab, setTab] = useState<"home" | "orders" | "menu" | "settings">("home");
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
  const [sortMode, setSortMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fetchError, setFetchError] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderUpdating, setOrderUpdating] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<"active" | "all">("active");
  const [autoPrint, setAutoPrint] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [soundType, setSoundType] = useState<"1"|"2"|"3">("1");
  const [autoConfirm, setAutoConfirm] = useState(false);
  const orderRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const fetchOrders = useCallback(async (isFirstLoad = false) => {
    // store.id가 있으면 그것을 사용 (URL storeId가 북마크/별칭일 때 대비)
    const queryStoreId = store?.id ?? storeId;
    try {
      const status = orderFilter === "active" ? "&status=PENDING,CONFIRMED,PREPARING,READY" : "";
      const res = await fetch(`/api/gbrick/admin/orders?storeId=${queryStoreId}${status}`, { cache: "no-store" });
      const d = await res.json() as { orders: OrderRow[]; _warn?: string };
      const fetched = d.orders ?? [];
      setOrders(fetched);

      // 새 PENDING 주문 감지 (최초 로드가 아닐 때만)
      if (!isFirstLoad) {
        const storeName = store?.name ?? "GBRICK";
        const newOrders = fetched.filter(o => o.status === "PENDING" && !knownOrderIds.current.has(o.id));
        if (newOrders.length > 0) {
          sendNewOrderNotif(storeName, newOrders.length);
          if (autoPrint) newOrders.forEach(o => printKitchenTicket(o, storeName));
        }
      }
      // 알려진 주문 ID 갱신
      fetched.forEach(o => knownOrderIds.current.add(o.id));
    } catch { /* 조용히 실패 */ }
  }, [storeId, store?.id, orderFilter, autoPrint, store?.name]);

  useEffect(() => {
    if (tab !== "orders") return;
    knownOrderIds.current = new Set(); // 탭 진입 시 초기화
    fetchOrders(true);                 // 첫 로드는 자동출력 안 함
    orderRefreshRef.current = setInterval(() => fetchOrders(false), 30_000);
    return () => { if (orderRefreshRef.current) clearInterval(orderRefreshRef.current); };
  }, [tab, fetchOrders]);

  async function handleOrderStatus(orderId: string, nextStatus: string) {
    setOrderUpdating(orderId);
    // 옵티미스틱 업데이트 — UI가 즉시 반영돼 중복 클릭 방지
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    try {
      const res = await fetch(`/api/gbrick/orders/${orderId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(`상태 변경: ${ORDER_STATUS_LABEL[nextStatus]?.label ?? nextStatus}`);
        if (nextStatus === "CONFIRMED") {
          const target = orders.find(o => o.id === orderId);
          if (target) printKitchenTicket(target, store?.name ?? "GBRICK");
        }
        await fetchOrders(false);
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(`오류: ${(d as { error?: string }).error ?? res.status}`);
        // 실패 시 DB 상태로 복원
        await fetchOrders(false);
      }
    } catch { showToast("서버 오류"); await fetchOrders(false); } finally { setOrderUpdating(null); }
  }

  async function handleCancelOrder(orderId: string) {
    setOrderUpdating(orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "CANCELLED" } : o));
    try {
      const res = await fetch(`/api/gbrick/orders/${orderId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED", note: "사장님 취소" }),
      });
      if (res.ok) { showToast("주문 취소됨"); }
      else { showToast("취소 실패"); }
      await fetchOrders(false);
    } catch { showToast("서버 오류"); await fetchOrders(false); } finally { setOrderUpdating(null); }
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch(`/api/gbrick/admin/stores/${storeId}`, { cache: "no-store" });
      const d = await res.json() as { store: Store; categories: Category[]; error?: string };
      if (res.status === 404 || d.error === "STORE_NOT_FOUND") {
        // 잘못된 storeId → 매장 선택 화면으로 이동
        router.replace("/gbrick/admin");
        return;
      }
      if (d.error) {
        setFetchError(`API 오류: ${d.error} (storeId: ${storeId})`);
        return;
      }
      if (!d.store) {
        setFetchError(`매장을 찾을 수 없습니다 (storeId: ${storeId})`);
        return;
      }
      setStore(d.store);
      const cats = d.categories ?? [];
      setCategories(cats);
      if (cats[0]) setActiveCat(cats[0].id);
      if (d.store.operatingHours) setHours({ ...DEFAULT_HOURS, ...(d.store.operatingHours as StoreOperatingHours) });
      const init: Record<string, boolean> = {};
      cats.forEach(cat => cat.menus.forEach(m => { init[m.id] = m.storeAvailability?.[0]?.isSoldOut ?? m.isSoldOut; }));
      setSoldOuts(init);
    } catch (e) {
      setFetchError(`네트워크 오류: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 브라우저 알림 권한 상태 초기화
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const count = orders.filter(o => o.status === "PENDING").length;
    document.title = count > 0
      ? `(${count}) 새 주문 | ${store?.name ?? "GBRICK POS"}`
      : (store?.name ?? "GBRICK POS");
  }, [orders, store?.name]);

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
      const res = await fetch(`/api/gbrick/admin/menus/${editMenu.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, nameEn: editForm.nameEn || null, description: editForm.description || null, basePrice: Number(editForm.basePrice), imageUrl: editForm.imageUrl || null }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(`저장 실패: ${(d as { error?: string }).error ?? res.status}`); return; }
      showToast("저장됐습니다"); setEditMenu(null); await fetchData();
    } catch { showToast("저장 실패"); } finally { setSaving(false); }
  }

  async function saveSortOrder() {
    const cat = categories.find(c => c.id === activeCat);
    if (!cat) return;
    setSaving(true);
    try {
      await Promise.all(cat.menus.map((menu, idx) =>
        fetch(`/api/gbrick/admin/menus/${menu.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: idx }),
        })
      ));
      showToast("순서가 저장됐습니다");
      setSortMode(false);
    } catch { showToast("순서 저장 실패"); } finally { setSaving(false); }
  }

  function moveMenu(catId: string, fromIdx: number, toIdx: number) {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      const menus = [...cat.menus];
      const [moved] = menus.splice(fromIdx, 1);
      menus.splice(toIdx, 0, moved);
      return { ...cat, menus };
    }));
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
  const pendingCount = orders.filter(o => o.status === "PENDING").length;

  return (
    <>
      {/* ═══════════════ DESKTOP KANBAN POS (md+) ═══════════════ */}
      <div className="hidden md:flex h-screen overflow-hidden" style={{ background: "#F0EDE8" }}>
        {/* Left Sidebar */}
        <aside style={{ width: 68, background: "#2C1A0E", flexShrink: 0 }} className="flex flex-col items-center pt-4 pb-4 gap-2">
          <div className="mb-3 mt-1">
            <span className="text-amber-300 font-black text-xs tracking-tighter">GB</span>
          </div>
          {([
            { key: "home", label: "홈", Icon: IconHome },
            { key: "orders", label: "주문", Icon: IconOrders },
            { key: "menu", label: "메뉴", Icon: IconMenu },
            { key: "settings", label: "설정", Icon: IconSettings },
          ] as const).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)} className="relative flex flex-col items-center w-full py-3 gap-1 transition-colors"
              style={{ background: tab === key ? "rgba(200,135,58,0.15)" : "transparent" }}>
              <Icon active={tab === key} />
              {key === "orders" && pendingCount > 0 && (
                <span className="absolute top-1.5 right-3 w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center"
                  style={{ background: "#EF4444" }}>
                  {pendingCount}
                </span>
              )}
              <span className="text-[9px] font-semibold mt-0.5" style={{ color: tab === key ? "#C8873A" : "#6B7280" }}>{label}</span>
            </button>
          ))}
          {/* 매장 변경 */}
          <div className="flex-1" />
          <button onClick={() => router.push("/gbrick/admin")} title="매장 변경"
            className="flex flex-col items-center w-full py-3 gap-1 transition-opacity hover:opacity-70">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            <span className="text-[8px] font-semibold text-stone-500">매장변경</span>
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header style={{ background: "#2C1A0E", height: 52, flexShrink: 0 }} className="flex items-center px-5 gap-3">
            <span className="text-amber-300 font-black text-sm tracking-tight">GBRICK</span>
            <span className="text-xs text-amber-200 bg-amber-900 px-2 py-0.5 rounded-full font-semibold">사장님 POS</span>
            <span className="text-white font-bold text-sm">{store?.name ?? "지브릭커피"}</span>
            <div className="flex items-center gap-1.5 ml-1">
              <span className="w-2 h-2 rounded-full" style={{ background: isOpenToday ? "#22C55E" : "#9CA3AF" }} />
              <span className="text-xs" style={{ color: isOpenToday ? "#86EFAC" : "#9CA3AF" }}>
                {isOpenToday ? "영업중" : "휴무"}
              </span>
            </div>
            <div className="flex-1" />
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "#F59E0B" }}>
                <span className="text-xs font-black text-white">🔔 새 주문 {pendingCount}건</span>
              </div>
            )}
            <button onClick={() => fetchOrders(false)} className="p-2 rounded-lg ml-1" style={{ background: "rgba(255,255,255,0.08)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8873A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
          </header>

          {/* Kanban - Orders */}
          {tab === "orders" && (
            <div className="flex-1 overflow-hidden p-4 flex gap-3">
              {([
                { title: "접수 대기", color: "#F59E0B", statuses: ["PENDING"] },
                { title: "조리중",   color: "#8B5CF6", statuses: ["CONFIRMED", "PREPARING"] },
                { title: "완료",     color: "#10B981", statuses: ["READY", "PICKED_UP"] },
              ] as const).map(col => {
                const colOrders = orders.filter(o => (col.statuses as readonly string[]).includes(o.status));
                const colCount = colOrders.length;
                return (
                  <div key={col.title} className="flex-1 flex flex-col overflow-hidden rounded-2xl" style={{ background: "#fff", border: "1px solid #E7E5E4" }}>
                    <div className="px-4 py-3 flex items-center gap-2 border-b border-stone-100" style={{ flexShrink: 0 }}>
                      <span className="w-3 h-3 rounded-full" style={{ background: col.color }} />
                      <span className="font-bold text-sm text-stone-800">{col.title}</span>
                      <span className="ml-auto text-xs font-black px-2.5 py-0.5 rounded-full text-white"
                        style={{ background: colCount > 0 ? col.color : "#D1D5DB" }}>
                        {colCount}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                      {colOrders.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-stone-300 py-10">
                          <span className="text-4xl mb-2">📋</span>
                          <span className="text-xs">없음</span>
                        </div>
                      ) : (
                        colOrders.map(order => {
                          const next = NEXT_STATUS[order.status];
                          const isUpdating = orderUpdating === order.id;
                          const canCancel = ["PENDING", "CONFIRMED", "PREPARING"].includes(order.status);
                          const timeAgo = (() => {
                            const diff = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                            if (diff < 1) return "방금";
                            if (diff < 60) return `${diff}분 전`;
                            return `${Math.floor(diff / 60)}시간 전`;
                          })();
                          return (
                            <div key={order.id} className="rounded-xl border overflow-hidden"
                              style={{ borderColor: order.status === "PENDING" ? "#F59E0B" : "#E7E5E4", background: order.status === "PENDING" ? "#FFFBF3" : "#fff" }}>
                              <div className="px-3 pt-2.5 pb-1 flex items-center gap-2">
                                <span className="text-xs font-mono text-stone-400 truncate flex-1">{order.orderNumber}</span>
                                <span className="text-xs text-stone-400 shrink-0">{timeAgo}</span>
                                <button onClick={() => printKitchenTicket(order, store?.name ?? "GBRICK")}
                                  className="w-6 h-6 flex items-center justify-center rounded text-xs border border-stone-200 shrink-0"
                                  style={{ background: "#F5F0EB" }}>🖨️</button>
                              </div>
                              <div className="px-3 pb-2">
                                <div className="font-black text-stone-800" style={{ fontSize: 15 }}>{order.pickupName ?? "손님"}</div>
                                {order.note && <p className="text-xs text-amber-600 mt-0.5">📝 {order.note}</p>}
                                {order.items && order.items.length > 0 && (
                                  <div className="mt-1.5 space-y-0.5">
                                    {order.items.map((item, i) => (
                                      <div key={i} className="flex items-center justify-between text-xs text-stone-600">
                                        <span className="truncate">{item.menuName} ×{item.quantity}</span>
                                        <span className="font-semibold ml-2 shrink-0" style={{ color: "#C8873A" }}>{(item.unitPrice * item.quantity).toLocaleString()}원</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="mt-1.5 text-xs font-black text-right" style={{ color: "#2C1A0E" }}>{order.finalAmount.toLocaleString()}원</div>
                              </div>
                              {(next || canCancel) && (
                                <div className="px-3 pb-3 flex gap-1.5">
                                  {next && (
                                    <button onClick={() => handleOrderStatus(order.id, next.next)} disabled={isUpdating}
                                      className="flex-1 py-2 rounded-lg text-white text-xs font-bold"
                                      style={{ background: isUpdating ? "#9CA3AF" : next.btnColor }}>
                                      {isUpdating ? "처리 중..." : next.action}
                                    </button>
                                  )}
                                  {canCancel && (
                                    <button onClick={() => handleCancelOrder(order.id)} disabled={isUpdating}
                                      className="py-2 px-3 rounded-lg text-xs font-semibold border"
                                      style={{ color: "#EF4444", borderColor: "#FEE2E2", background: "#FFF5F5" }}>
                                      취소
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Desktop Home */}
          {tab === "home" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl">
                <h2 className="text-lg font-bold text-stone-800 mb-4">오늘 현황</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "전체 메뉴", value: totalMenuCount, unit: "개", icon: "🍵" },
                    { label: "품절 처리", value: soldOutCount,   unit: "개", icon: "🚫" },
                    { label: "대기 주문", value: pendingCount,   unit: "건", icon: "🔔" },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <div className="text-2xl font-black text-stone-800">{stat.value}<span className="text-sm font-normal text-stone-400 ml-1">{stat.unit}</span></div>
                      <div className="text-xs text-stone-400 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                  <h3 className="text-sm font-bold text-stone-700 mb-3">이번 주 영업시간</h3>
                  {(Object.keys(DAY_LABELS) as (keyof StoreOperatingHours)[]).map(day => {
                    const h = hours[day];
                    const isToday = day === todayKey;
                    return (
                      <div key={day} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                        <span className="text-sm w-6 font-semibold"
                          style={{ color: day === "sun" ? "#EF4444" : day === "sat" ? "#3B82F6" : isToday ? "#C8873A" : "#6B7280" }}>
                          {DAY_LABELS[day]}
                        </span>
                        <span className="text-sm" style={{ color: h.closed ? "#9CA3AF" : "#374151" }}>
                          {h.closed ? "휴무" : `${h.open} ~ ${h.close}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Desktop Settings */}
          {tab === "settings" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl flex flex-col gap-6">
                <div>
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">운영 설정</h3>
                  <div className="bg-white rounded-2xl shadow-sm border border-stone-100 divide-y divide-stone-50">
                    {[
                      { label: "주문 접수 시 자동 조리 시작", sub: "접수 버튼 없이 바로 조리 시작됩니다", value: autoConfirm, setter: setAutoConfirm },
                      { label: "조리 시작 시 자동 주문서 출력", sub: "주방 빌지를 자동으로 출력합니다", value: autoPrint, setter: setAutoPrint },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-stone-800">{item.label}</p>
                          <p className="text-xs text-stone-400">{item.sub}</p>
                        </div>
                        <button onClick={() => item.setter((p: boolean) => !p)}
                          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                          style={{ background: item.value ? "#2C1A0E" : "#D1D5DB" }}>
                          <span className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                            style={{ transform: item.value ? "translateX(24px)" : "translateX(2px)" }} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-stone-800">주문 접수 알림음</p>
                        <p className="text-xs text-stone-400">새 주문이 오면 소리로 알려줍니다</p>
                      </div>
                      <select value={soundType} onChange={e => setSoundType(e.target.value as "1"|"2"|"3")}
                        className="text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white">
                        <option value="1">알림음 1</option>
                        <option value="2">알림음 2</option>
                        <option value="3">알림음 3</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-stone-800">알림 권한</p>
                        <p className="text-xs text-stone-400">브라우저 알림으로 새 주문을 받습니다</p>
                      </div>
                      {notifPermission === "granted" ? (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">허용됨</span>
                      ) : (
                        <button onClick={async () => {
                          if (!("Notification" in window)) return;
                          const perm = await Notification.requestPermission();
                          setNotifPermission(perm);
                        }} className="text-xs font-bold text-white px-3 py-1.5 rounded-lg" style={{ background: "#C8873A" }}>
                          알림 허용
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">영업시간</h3>
                  <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    {(Object.keys(DAY_LABELS) as (keyof StoreOperatingHours)[]).map((day, idx) => {
                      const h = hours[day];
                      const isToday = day === todayKey;
                      return (
                        <div key={day} className="px-5 py-3 flex items-center gap-3"
                          style={{ borderTop: idx > 0 ? "1px solid #F3F4F6" : "none", background: isToday ? "#FFFBF7" : "transparent" }}>
                          <span className="text-sm font-bold w-8 shrink-0"
                            style={{ color: day === "sun" ? "#EF4444" : day === "sat" ? "#3B82F6" : isToday ? "#C8873A" : "#374151" }}>
                            {DAY_LABELS[day]}
                          </span>
                          {h.closed ? (
                            <span className="text-sm text-stone-400 flex-1">휴무일</span>
                          ) : (
                            <div className="flex items-center gap-2 flex-1">
                              <input type="time" value={h.open}
                                onChange={e => setHours(p => ({ ...p, [day]: { ...p[day], open: e.target.value } }))}
                                className="text-sm border border-stone-200 rounded-lg px-2 py-1 w-28" />
                              <span className="text-stone-400">~</span>
                              <input type="time" value={h.close}
                                onChange={e => setHours(p => ({ ...p, [day]: { ...p[day], close: e.target.value } }))}
                                className="text-sm border border-stone-200 rounded-lg px-2 py-1 w-28" />
                            </div>
                          )}
                          <button onClick={() => setHours(p => ({ ...p, [day]: { ...p[day], closed: !p[day].closed } }))}
                            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
                            style={{ background: h.closed ? "#2C1A0E" : "#D1D5DB" }}>
                            <span className="inline-block h-3 w-3 rounded-full bg-white shadow transition-transform"
                              style={{ transform: h.closed ? "translateX(18px)" : "translateX(2px)" }} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={saveHours} disabled={saving}
                    className="mt-3 px-6 py-3 rounded-xl text-white font-bold text-sm"
                    style={{ background: saving ? "#9CA3AF" : "#2C1A0E" }}>
                    {saving ? "저장 중..." : "영업시간 저장"}
                  </button>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">매장 정보</h3>
                  <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 space-y-3">
                    <div>
                      <p className="text-xs text-stone-400">매장 ID</p>
                      <p className="text-sm font-mono text-stone-600">{store?.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400">매장명</p>
                      <p className="text-sm font-semibold text-stone-800">{store?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400">전화번호</p>
                      <p className="text-sm text-stone-700">{store?.phone ?? "미입력"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Menu */}
          {tab === "menu" && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-stone-100">
                <div className="flex overflow-x-auto gap-2">
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => { setActiveCat(cat.id); setSortMode(false); }}
                      className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium"
                      style={{ background: activeCat === cat.id ? "#2C1A0E" : "#F5F5F4", color: activeCat === cat.id ? "#fff" : "#6B7280" }}>
                      {cat.name} <span className="opacity-60">({cat.menus.length})</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                  {menus.map(menu => {
                    const sold = soldOuts[menu.id] ?? false;
                    return (
                      <div key={menu.id} className="bg-white rounded-xl border border-stone-100 p-3 flex items-center gap-3 shadow-sm"
                        style={{ opacity: sold ? 0.6 : 1 }}>
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "#F5F0EB" }}>
                          {menu.imageUrl ? <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover" /> : <span className="text-2xl">☕</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-stone-800 truncate">{menu.name}</p>
                          <p className="text-sm font-bold" style={{ color: "#2C1A0E" }}>{menu.basePrice.toLocaleString()}원</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => openEdit(menu)} className="p-2 rounded-lg" style={{ background: "#F5F0EB" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button onClick={() => toggleSoldOut(menu.id)}
                            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                            style={{ background: sold ? "#EF4444" : "#D1D5DB" }}>
                            <span className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                              style={{ transform: sold ? "translateX(24px)" : "translateX(2px)" }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ MOBILE LAYOUT (< md) ═══════════════════ */}
      <div className="md:hidden min-h-screen flex flex-col" style={{ background: "#F9F7F5" }}>

      {/* ─── Header ─── */}
      <header style={{ background: "#2C1A0E" }} className="px-5 pt-12 pb-5">
        {/* 매장 변경 버튼 */}
        <button onClick={() => router.push("/gbrick/admin")}
          className="flex items-center gap-1.5 mb-3 opacity-70 hover:opacity-100 transition-opacity">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8873A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span className="text-[11px] font-semibold text-amber-400">매장 변경</span>
        </button>
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
            {fetchError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs font-bold text-red-600 mb-1">⚠️ 데이터 로드 실패</p>
                <p className="text-xs text-red-500 break-all">{fetchError}</p>
                <button onClick={fetchData} className="mt-2 text-xs font-bold text-red-600 underline">다시 시도</button>
              </div>
            )}

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
            {/* 카테고리 탭 + 순서 편집 토글 */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-stone-100">
              <div className="flex overflow-x-auto gap-2 flex-1 min-w-0">
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => { setActiveCat(cat.id); setSortMode(false); }}
                    className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                    style={{ background: activeCat === cat.id ? "#2C1A0E" : "#F5F5F4", color: activeCat === cat.id ? "#fff" : "#6B7280" }}>
                    {cat.name} <span className="opacity-60">({cat.menus.length})</span>
                  </button>
                ))}
              </div>
              {/* 순서 편집 토글 */}
              {!sortMode ? (
                <button onClick={() => setSortMode(true)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border"
                  style={{ borderColor: "#C8873A", color: "#C8873A", background: "white" }}>
                  순서 편집
                </button>
              ) : (
                <div className="flex shrink-0 gap-1.5">
                  <button onClick={() => setSortMode(false)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: "#F5F5F4", color: "#6B7280" }}>
                    취소
                  </button>
                  <button onClick={saveSortOrder} disabled={saving}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: saving ? "#D1C5BB" : "#2C1A0E" }}>
                    저장
                  </button>
                </div>
              )}
            </div>

            {/* 메뉴 리스트 */}
            <div className="px-4 pt-4 flex flex-col gap-2">
              {categories.length === 0 && (
                <div className="text-center py-10 text-sm text-stone-400">
                  <p className="text-2xl mb-2">⚠️</p>
                  <p className="font-semibold">메뉴를 불러올 수 없습니다</p>
                  <p className="text-xs mt-1">storeId: {storeId}</p>
                  <button onClick={fetchData} className="mt-3 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: "#C8873A" }}>
                    새로고침
                  </button>
                </div>
              )}
              {sortMode && menus.length > 0 && (
                <p className="text-xs text-stone-400 text-center pb-1">↑↓ 버튼으로 순서를 변경하고 저장하세요</p>
              )}
              {menus.map((menu, idx) => {
                const sold = soldOuts[menu.id] ?? false;
                return (
                  <div key={menu.id} className="bg-white rounded-xl shadow-sm border border-stone-100 p-3 flex items-center gap-3"
                    style={{ opacity: sold && !sortMode ? 0.6 : 1 }}>
                    {/* 순서 편집 모드: ↑↓ 버튼 */}
                    {sortMode && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => idx > 0 && moveMenu(activeCat, idx, idx - 1)}
                          disabled={idx === 0}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: idx === 0 ? "#F3F4F6" : "#2C1A0E", color: idx === 0 ? "#D1D5DB" : "white" }}>
                          ↑
                        </button>
                        <button
                          onClick={() => idx < menus.length - 1 && moveMenu(activeCat, idx, idx + 1)}
                          disabled={idx === menus.length - 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: idx === menus.length - 1 ? "#F3F4F6" : "#2C1A0E", color: idx === menus.length - 1 ? "#D1D5DB" : "white" }}>
                          ↓
                        </button>
                      </div>
                    )}
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
                    {!sortMode && (
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ 주문 탭 ════ */}
        {tab === "orders" && (
          <div className="flex flex-col h-full">
            {/* 필터 + 자동출력 토글 + 새로고침 */}
            <div className="flex flex-col bg-white border-b border-stone-100">
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="flex gap-2 flex-1">
                  {(["active", "all"] as const).map(f => (
                    <button key={f} onClick={() => setOrderFilter(f)}
                      className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                      style={{ background: orderFilter === f ? "#2C1A0E" : "#F5F5F4", color: orderFilter === f ? "#fff" : "#6B7280" }}>
                      {f === "active" ? "진행중" : "전체"}
                    </button>
                  ))}
                </div>
                <button onClick={() => fetchOrders(false)} className="p-2 rounded-lg" style={{ background: "#F5F5F4" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                  </svg>
                </button>
              </div>
              {/* 알림 허용 배너 */}
              {notifPermission !== "granted" && (
                <div className="mx-4 mb-2 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-xs font-bold text-amber-800">🔔 알림을 허용해주세요</p>
                    <p className="text-[10px] text-amber-600">새 주문 도착 시 알림을 받으려면 허용이 필요합니다</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!("Notification" in window)) return;
                      const perm = await Notification.requestPermission();
                      setNotifPermission(perm);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0 ml-2"
                    style={{ background: "#C8873A" }}>
                    허용
                  </button>
                </div>
              )}
              {/* 자동출력 토글 */}
              <div className="flex items-center justify-between px-4 pb-3">
                <div>
                  <span className="text-xs font-bold text-stone-700">🖨️ 주방 빌지 자동 출력</span>
                  <p className="text-[11px] text-stone-400">새 주문 도착 시 자동으로 출력됩니다</p>
                </div>
                <button onClick={() => setAutoPrint(p => !p)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ background: autoPrint ? "#2C1A0E" : "#D1D5DB" }}>
                  <span className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: autoPrint ? "translateX(24px)" : "translateX(2px)" }} />
                </button>
              </div>
            </div>

            {/* 주문 목록 */}
            <div className="px-4 pt-4 flex flex-col gap-3 overflow-y-auto pb-4">
              {orders.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📋</p>
                  <p className="text-sm font-semibold text-stone-500">
                    {orderFilter === "active" ? "진행 중인 주문이 없습니다" : "주문 내역이 없습니다"}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">고객이 주문하면 여기에 표시됩니다</p>
                </div>
              ) : (
                orders.map(order => {
                  const st = ORDER_STATUS_LABEL[order.status] ?? { label: order.status, color: "#9CA3AF" };
                  const next = NEXT_STATUS[order.status];
                  const isUpdating = orderUpdating === order.id;
                  const canCancel = ["PENDING", "CONFIRMED", "PREPARING"].includes(order.status);
                  const timeAgo = (() => {
                    const diff = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                    if (diff < 1) return "방금";
                    if (diff < 60) return `${diff}분 전`;
                    return `${Math.floor(diff / 60)}시간 전`;
                  })();
                  return (
                    <div key={order.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden"
                      style={{ borderColor: order.status === "PENDING" ? "#F59E0B" : "#E7E5E4" }}>
                      {/* 주문 헤더 */}
                      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-stone-400">{order.orderNumber}</span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
                            style={{ background: st.color }}>{st.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-400">{timeAgo}</span>
                          <button onClick={() => printKitchenTicket(order, store?.name ?? "GBRICK")}
                            title="주방 빌지 출력"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-sm border border-stone-200"
                            style={{ background: "#F5F0EB" }}>
                            🖨️
                          </button>
                        </div>
                      </div>
                      {/* 픽업명 + 금액 */}
                      <div className="px-4 pb-2 flex items-center justify-between">
                        <div>
                          <span className="text-base font-black text-stone-800">{order.pickupName ?? "손님"}</span>
                          {order.note && <p className="text-xs text-amber-600 mt-0.5">📝 {order.note}</p>}
                        </div>
                        <span className="text-sm font-bold" style={{ color: "#2C1A0E" }}>
                          {order.finalAmount.toLocaleString()}원
                        </span>
                      </div>
                      {/* 메뉴 목록 */}
                      {order.items && order.items.length > 0 && (
                        <div className="mx-4 mb-3 bg-stone-50 rounded-xl px-3 py-2.5 space-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-stone-700">{item.menuName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-stone-400">×{item.quantity}</span>
                                <span className="text-xs font-semibold" style={{ color: "#C8873A" }}>
                                  {(item.unitPrice * item.quantity).toLocaleString()}원
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* 액션 버튼 */}
                      {(next || canCancel) && (
                        <div className="px-4 pb-3 flex gap-2">
                          {next && (
                            <button onClick={() => handleOrderStatus(order.id, next.next)} disabled={isUpdating}
                              className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-opacity active:scale-95"
                              style={{ background: isUpdating ? "#9CA3AF" : next.btnColor, opacity: isUpdating ? 0.7 : 1, fontSize: 15 }}>
                              {isUpdating ? "처리 중..." : next.action}
                            </button>
                          )}
                          {canCancel && (
                            <button onClick={() => handleCancelOrder(order.id)} disabled={isUpdating}
                              className="py-3 px-4 rounded-xl text-sm font-semibold border transition-opacity"
                              style={{ color: "#EF4444", borderColor: "#FEE2E2", background: "#FFF5F5", opacity: isUpdating ? 0.5 : 1 }}>
                              취소
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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
            { key: "orders", label: "주문", Icon: IconOrders },
            { key: "menu", label: "메뉴", Icon: IconMenu },
            { key: "settings", label: "설정", Icon: IconSettings },
          ] as const).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)} className="flex-1 flex flex-col items-center py-3 gap-1 relative">
              <Icon active={tab === key} />
              {key === "orders" && orders.filter(o => o.status === "PENDING").length > 0 && (
                <span className="absolute top-2 right-[calc(50%-16px)] w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center"
                  style={{ background: "#EF4444" }}>
                  {orders.filter(o => o.status === "PENDING").length}
                </span>
              )}
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
    </>
  );
}
