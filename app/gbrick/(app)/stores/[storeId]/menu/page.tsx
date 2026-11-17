"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { haversineKm, formatDistance } from "@/lib/gbrick/utils/distance";
import { DEFAULT_OPTIONS } from "@/lib/gbrick/defaultOptions";
import { isSingleSelectGroup, orderGroups } from "@/lib/gbrick/optionGroups";

interface MenuOption {
  id: string;
  name: string;
  extraPrice: number;
  isDefault: boolean;
  groupName?: string;
}

interface Menu {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
  isSignature: boolean;
  isNew: boolean;
  isSoldOut: boolean;
  tags: string[];
  options: MenuOption[];
  optionsConfigured?: boolean;
}

interface Category {
  id: string;
  name: string;
  menus: Menu[];
}

interface CartItem {
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  options: { menuOptionId: string; optionName: string; extraPrice: number }[];
}

interface StoreInfo {
  id: string;
  name: string;
  status: string;
  lat?: number | null;
  lng?: number | null;
}

export default function MenuPage() {
  const params = useParams();
  const storeId = params.storeId as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const [defaultOptions, setDefaultOptions] = useState<MenuOption[]>(DEFAULT_OPTIONS);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedTemp, setSelectedTemp] = useState<string>("");
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Load cart + user position from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("gbrick_cart");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.storeId === storeId) setCart(data.items ?? []);
      }
      const pos = sessionStorage.getItem("gbrick_userPos");
      if (pos) setUserPos(JSON.parse(pos));
    } catch {}
  }, [storeId]);

  // Fetch menus + store info
  useEffect(() => {
    Promise.all([
      fetch(`/api/gbrick/menus?storeId=${storeId}`).then(r => r.json()),
      fetch(`/api/gbrick/admin/stores/${storeId}`).then(r => r.json()).catch(() => null),
    ]).then(([menuData, storeData]) => {
      setCategories(menuData.categories ?? []);
      if (Array.isArray(menuData.defaultOptions)) setDefaultOptions(menuData.defaultOptions);
      if (menuData.categories?.[0]) setActiveCategory(menuData.categories[0].id);
      if (storeData?.store) setStoreInfo(storeData.store);
    }).catch(console.error).finally(() => setLoading(false));
  }, [storeId]);

  function openMenu(menu: Menu) {
    if (menu.isSoldOut) return;
    // 사장님이 옵션을 직접 관리하는 메뉴는 전부 숨겼어도 기본 옵션으로 되돌리지 않는다
    const opts = menu.options.length > 0 || menu.optionsConfigured ? menu.options : defaultOptions;
    setSelectedMenu({ ...menu, options: opts });
    setSelectedExtras(new Set());
    setShowOptionsSheet(false);
    const tempOpts = opts.filter(o => o.groupName === "온도");
    if (tempOpts.length > 0) {
      const def = tempOpts.find(o => o.isDefault) ?? tempOpts[0];
      setSelectedTemp(def.id);
    } else {
      setSelectedTemp("");
    }
  }

  function addToCart() {
    if (!selectedMenu) return;
    const extraOpts = [...selectedExtras].map(id => {
      const opt = selectedMenu.options.find(o => o.id === id)!;
      return { menuOptionId: opt.id, optionName: opt.name, extraPrice: opt.extraPrice };
    });
    const tempOpt = selectedTemp
      ? selectedMenu.options.find(o => o.id === selectedTemp)
      : null;
    const chosenOptions = [
      ...extraOpts,
      ...(tempOpt ? [{ menuOptionId: tempOpt.id, optionName: tempOpt.name, extraPrice: tempOpt.extraPrice }] : []),
    ];
    const extraTotal = chosenOptions.reduce((s, o) => s + o.extraPrice, 0);
    const newItem: CartItem = {
      menuId: selectedMenu.id,
      menuName: selectedMenu.name,
      quantity: 1,
      unitPrice: selectedMenu.basePrice + extraTotal,
      options: chosenOptions,
    };
    const updatedCart = [...cart];
    const existing = updatedCart.findIndex(c => c.menuId === selectedMenu.id);
    if (existing >= 0) updatedCart[existing].quantity += 1;
    else updatedCart.push(newItem);
    setCart(updatedCart);
    sessionStorage.setItem("gbrick_cart", JSON.stringify({ storeId, items: updatedCart }));
    setSelectedMenu(null);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  }

  const cartTotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const modalExtraTotal = selectedMenu
    ? [...selectedExtras, ...(selectedTemp ? [selectedTemp] : [])]
        .reduce((s, id) => s + (selectedMenu.options.find(o => o.id === id)?.extraPrice ?? 0), 0)
    : 0;
  // 온도 외의 옵션 — 묶음별로 보여 주고, 우유변경처럼 하나만 고르는 묶음은 같은 묶음의 다른 선택을 지운다
  const sheetOptions = selectedMenu ? selectedMenu.options.filter(o => o.groupName !== "온도") : [];
  const sheetGroups = orderGroups(sheetOptions.map(o => o.groupName || "추가옵션"));
  function toggleSheetOption(opt: MenuOption) {
    const group = opt.groupName || "추가옵션";
    setSelectedExtras(prev => {
      const next = new Set(prev);
      if (next.has(opt.id)) { next.delete(opt.id); return next; }
      if (isSingleSelectGroup(group)) {
        for (const o of sheetOptions) if ((o.groupName || "추가옵션") === group) next.delete(o.id);
      }
      next.add(opt.id);
      return next;
    });
  }
  function clearSheetGroup(group: string) {
    setSelectedExtras(prev => {
      const next = new Set(prev);
      for (const o of sheetOptions) if ((o.groupName || "추가옵션") === group) next.delete(o.id);
      return next;
    });
  }
  const modalTotal = selectedMenu ? selectedMenu.basePrice + modalExtraTotal : 0;
  const storeDist = userPos && storeInfo?.lat && storeInfo?.lng
    ? haversineKm(userPos.lat, userPos.lng, storeInfo.lat, storeInfo.lng)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#FAF8F5" }}>
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin"/>
          <p className="text-sm text-stone-400 mt-3">메뉴 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col min-h-screen pb-32" style={{ background: "#FAF8F5" }}>
      {/* Header */}
      <header
        className="flex items-center px-4 bg-white border-b border-stone-100"
        style={{ height: 56, paddingTop: "env(safe-area-inset-top)" }}
      >
        <Link href="/gbrick/stores" className="p-1 mr-2" aria-label="뒤로">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <span className="font-bold text-base" style={{ color: "#2C1A0E" }}>상품리스트</span>
        <div className="ml-auto flex items-center gap-3">
          <button className="p-1" aria-label="검색">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          <Link
            href="/gbrick/cart"
            className="p-1 relative"
            aria-label="장바구니"
            onClick={() => sessionStorage.setItem("gbrick_cart", JSON.stringify({ storeId, items: cart }))}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-black flex items-center justify-center"
                style={{ background: "#C8873A" }}
              >
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Category tabs */}
      <div className="flex overflow-x-auto gap-1 px-4 py-2.5 bg-white border-b border-stone-100 sticky top-0 z-10">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            style={{
              background: activeCategory === cat.id ? "#2C1A0E" : "transparent",
              color: activeCategory === cat.id ? "#fff" : "#6B7280",
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu list */}
      <div className="px-4 pt-4 flex flex-col gap-2">
        {categories
          .filter(c => !activeCategory || c.id === activeCategory)
          .map(cat => (
            <div key={cat.id}>
              <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 mt-1">
                {cat.name}
              </h2>
              {cat.menus.map(menu => (
                <button
                  key={menu.id}
                  onClick={() => openMenu(menu)}
                  disabled={menu.isSoldOut}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border border-stone-100 mb-2 text-left disabled:opacity-50"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                >
                  <div
                    className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center overflow-hidden relative"
                    style={{ background: "#F5F0EB" }}
                  >
                    {menu.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">☕</span>
                    )}
                    {menu.isNew && (
                      <span className="absolute top-1 left-1 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white bg-amber-400">NEW</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {menu.isSignature && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white mr-1 inline-block mb-0.5" style={{ background: "#C8873A" }}>추천</span>
                    )}
                    <span className="font-semibold text-sm text-stone-800 block leading-tight">{menu.name}</span>
                    {menu.nameEn && <span className="text-xs text-stone-400 block">{menu.nameEn}</span>}
                    {menu.description && (
                      <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{menu.description}</p>
                    )}
                    <p className="text-sm font-bold mt-1" style={{ color: "#2C1A0E" }}>
                      {menu.basePrice.toLocaleString()}원
                    </p>
                  </div>
                  {menu.isSoldOut
                    ? <span className="shrink-0 text-xs text-stone-400 font-bold">품절</span>
                    : <span className="shrink-0 text-stone-300 text-xl leading-none">+</span>
                  }
                </button>
              ))}
            </div>
          ))}
      </div>

      {/* Added to cart toast */}
      {addedFeedback && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[400] px-5 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg"
          style={{ background: "#2C1A0E", whiteSpace: "nowrap" }}
        >
          장바구니에 담았어요 🛒
        </div>
      )}

      {/* Product detail bottom sheet */}
      {selectedMenu && (
        <div
          className="fixed inset-0 z-[200] flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelectedMenu(null)}
        >
          <div
            className="w-full max-w-[480px] mx-auto bg-white rounded-t-3xl overflow-hidden"
            style={{ maxHeight: "92vh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Product image */}
            <div
              className="w-full flex items-center justify-center relative"
              style={{ height: 200, background: "linear-gradient(180deg,#FEFBE6 0%,#F5F0EB 100%)" }}
            >
              {selectedMenu.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedMenu.imageUrl} alt={selectedMenu.name} className="h-full w-full object-contain" />
              ) : (
                <span className="text-8xl">☕</span>
              )}
            </div>

            {/* Content */}
            <div
              className="overflow-y-auto px-5 pt-4"
              style={{ maxHeight: "calc(92vh - 200px)", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            >
              <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />

              {/* Title row */}
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {selectedMenu.isSignature && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: "#C8873A" }}>추천메뉴</span>
                    )}
                    {selectedMenu.isNew && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white bg-amber-400">NEW</span>
                    )}
                  </div>
                  <h3 className="font-bold text-xl text-stone-800 leading-tight">{selectedMenu.name}</h3>
                  {selectedMenu.description && (
                    <p className="text-xs text-stone-400 mt-0.5">{selectedMenu.description}</p>
                  )}
                </div>
                <button className="shrink-0 text-xs text-stone-400 font-semibold mt-2 underline">세부 정보</button>
              </div>

              <p className="text-2xl font-black mt-2 mb-5" style={{ color: "#2C1A0E" }}>
                {modalTotal.toLocaleString()}원
              </p>

              {/* ICED / HOT toggle — compose coffee style */}
              {selectedMenu.options.some(o => o.groupName === "온도") && (
                <div className="flex gap-2 mb-5">
                  {selectedMenu.options.filter(o => o.groupName === "온도").map(opt => {
                    // 옵션 이름은 사장님 앱에서 바꿀 수 있다 — 알아볼 수 없는 이름은 그대로 보여 준다
                    const isHot = /따뜻|뜨겁|뜨거|핫|hot/i.test(opt.name);
                    const isIced = /아이스|차갑|차가|시원|ice/i.test(opt.name);
                    const isSelected = selectedTemp === opt.id;
                    const label = isHot ? "HOT" : isIced ? "ICED" : opt.name;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedTemp(opt.id)}
                        className="flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all"
                        style={{
                          background: isSelected ? (isHot ? "#FFF0F0" : "#EFF6FF") : "#F5F5F4",
                          borderColor: isSelected ? (isHot ? "#F87171" : "#60A5FA") : "#E5E7EB",
                          color: isSelected ? (isHot ? "#DC2626" : "#2563EB") : "#9CA3AF",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Add-on options */}
              {sheetOptions.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-stone-700 mb-2">옵션 선택</p>
                  <button
                    onClick={() => setShowOptionsSheet(true)}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold border-2 text-center transition-colors"
                    style={{
                      borderColor: selectedExtras.size > 0 ? "#C8873A" : "#E5E7EB",
                      color: selectedExtras.size > 0 ? "#C8873A" : "#6B7280",
                    }}
                  >
                    {selectedExtras.size > 0 ? `${selectedExtras.size}개 옵션 선택됨` : "옵션 선택 (우유·샷·시럽·사이즈)"}
                  </button>
                  {selectedExtras.size > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[...selectedExtras].map(id => {
                        const opt = selectedMenu.options.find(o => o.id === id);
                        if (!opt) return null;
                        return (
                          <span key={id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEF3E2", color: "#C8873A" }}>
                            {opt.name}{opt.extraPrice > 0 ? ` +${opt.extraPrice.toLocaleString()}원` : ""}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={addToCart}
                className="w-full py-4 rounded-2xl text-white font-bold text-base"
                style={{ background: "#2C1A0E" }}
              >
                담기 · {modalTotal.toLocaleString()}원
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Options bottom sheet — compose coffee style */}
      {showOptionsSheet && selectedMenu && (
        <div
          className="fixed inset-0 z-[300] flex items-end"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setShowOptionsSheet(false)}
        >
          <div
            className="w-full max-w-[480px] mx-auto bg-white rounded-t-3xl"
            style={{ maxHeight: "80vh" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mt-4 mb-3" />
            <div className="px-5 pb-2">
              <h3 className="font-bold text-base text-stone-800">옵션 선택</h3>
            </div>

            <div className="overflow-y-auto px-5" style={{ maxHeight: "calc(80vh - 160px)" }}>
              {sheetGroups.map(group => {
                const single = isSingleSelectGroup(group);
                const groupOpts = sheetOptions.filter(o => (o.groupName || "추가옵션") === group);
                const noneSelected = !groupOpts.some(o => selectedExtras.has(o.id));
                const mark = (selected: boolean) => (
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                    style={{ borderColor: selected ? "#C8873A" : "#D1D5DB", background: selected ? "#C8873A" : "transparent" }}>
                    {selected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                );
                return (
                  <div key={group} className="mb-2">
                    <p className="text-xs text-stone-500 font-semibold py-2 tracking-wider">
                      {group} <span className="font-normal text-stone-400">{single ? "· 하나만 선택" : "· 여러 개 선택 가능"}</span>
                    </p>
                    {single && (
                      <button onClick={() => clearSheetGroup(group)} className="w-full flex items-center justify-between py-4 border-b border-stone-50 text-left">
                        <span className="text-sm text-stone-800 font-medium">선택 안 함</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold" style={{ color: "#22C55E" }}>무료</span>
                          {mark(noneSelected)}
                        </div>
                      </button>
                    )}
                    {groupOpts.map(opt => {
                      const selected = selectedExtras.has(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleSheetOption(opt)}
                          className="w-full flex items-center justify-between py-4 border-b border-stone-50 text-left"
                        >
                          <span className="text-sm text-stone-800 font-medium">{opt.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold" style={{ color: opt.extraPrice === 0 ? "#22C55E" : "#3B82F6" }}>
                              {opt.extraPrice === 0 ? "무료" : `${opt.extraPrice.toLocaleString()}원`}
                            </span>
                            {mark(selected)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 px-5 pt-3" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
              <button
                onClick={() => setShowOptionsSheet(false)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 border-stone-200 text-stone-600"
              >
                취소
              </button>
              <button
                onClick={() => setShowOptionsSheet(false)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: "#C8873A" }}
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom bar: store info + cart (compose coffee style) */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-stone-100"
        style={{ zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Store info row */}
        <div className="flex items-center px-4 py-2.5 gap-2">
          <span className="font-bold text-sm text-stone-800 flex-1 truncate">
            {storeInfo?.name ?? "매장"}
          </span>
          {storeDist != null && (
            <span className="text-xs text-stone-500 shrink-0">{formatDistance(storeDist)}</span>
          )}
          <span
            className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: storeInfo?.status === "ACTIVE" ? "#22C55E" : "#6B7280" }}
          >
            {storeInfo?.status === "ACTIVE" ? "영업중" : "준비중"}
          </span>
          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#2C1A0E" }}>
            테이크아웃
          </span>
          <Link
            href="/gbrick/stores"
            className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600"
          >
            매장 변경
          </Link>
        </div>

        {/* Cart button */}
        {cartCount > 0 && (
          <div className="px-4 pb-3">
            <Link
              href="/gbrick/cart"
              onClick={() => sessionStorage.setItem("gbrick_cart", JSON.stringify({ storeId, items: cart }))}
              className="flex items-center justify-between px-5 py-3 rounded-2xl text-white font-bold"
              style={{ background: "#2C1A0E" }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                style={{ background: "#C8873A" }}
              >
                {cartCount}
              </span>
              <span>장바구니 보기</span>
              <span>{cartTotal.toLocaleString()}원</span>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
