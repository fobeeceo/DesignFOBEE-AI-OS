"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const DEFAULT_OPTIONS: MenuOption[] = [
  { id: "def-van",    name: "바닐라시럽",   extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-haz",   name: "헤이즐넛시럽", extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-whip",  name: "휘핑크림",     extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-eshot", name: "에스프레소샷", extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-pearl", name: "펄",           extraPrice: 700, isDefault: false, groupName: "추가옵션" },
  { id: "def-milk",  name: "우유추가",     extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-decaf", name: "디카페인샷",   extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-oat",   name: "오트밀크",     extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-almond",name: "아몬드브리즈", extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-lowsug",name: "저당시럽",     extraPrice: 300, isDefault: false, groupName: "추가옵션" },
  { id: "def-hot",   name: "따뜻하게",     extraPrice: 0,   isDefault: true,  groupName: "온도" },
  { id: "def-ice",   name: "아이스",       extraPrice: 0,   isDefault: false, groupName: "온도" },
];

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

export default function MenuPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  // 추가옵션은 다중 선택(체크 토글)
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/gbrick/menus?storeId=${storeId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories ?? []);
        if (d.categories?.[0]) setActiveCategory(d.categories[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [storeId]);

  function openMenu(menu: Menu) {
    if (menu.isSoldOut) return;
    // 옵션이 없으면 기본 옵션 삽입
    const opts = menu.options.length > 0 ? menu.options : DEFAULT_OPTIONS;
    setSelectedMenu({ ...menu, options: opts });
    setSelectedExtras(new Set());
    // 온도 등 단일선택 그룹 기본값 설정
    const defaults: Record<string, string> = {};
    const singleGroups = [...new Set(opts.filter(o => o.groupName === "온도").map((o) => o.groupName ?? "default"))];
    singleGroups.forEach((g) => {
      const def = opts.find((o) => (o.groupName ?? "default") === g && o.isDefault);
      if (def) defaults[g] = def.id;
    });
    setSelectedOptions(defaults);
  }

  function toggleExtra(optId: string) {
    setSelectedExtras((prev) => {
      const next = new Set(prev);
      if (next.has(optId)) next.delete(optId); else next.add(optId);
      return next;
    });
  }

  function addToCart() {
    if (!selectedMenu) return;
    // 추가옵션(다중) + 온도(단일) 합산
    const extraOpts = [...selectedExtras].map((optId) => {
      const opt = selectedMenu.options.find((o) => o.id === optId)!;
      return { menuOptionId: opt.id, optionName: opt.name, extraPrice: opt.extraPrice };
    });
    const singleOpts = Object.values(selectedOptions).map((optId) => {
      const opt = selectedMenu.options.find((o) => o.id === optId)!;
      return { menuOptionId: opt.id, optionName: opt.name, extraPrice: opt.extraPrice };
    }).filter(Boolean);
    const chosenOptions = [...extraOpts, ...singleOpts];
    const extraTotal = chosenOptions.reduce((s, o) => s + o.extraPrice, 0);
    const newItem: CartItem = {
      menuId: selectedMenu.id,
      menuName: selectedMenu.name,
      quantity: 1,
      unitPrice: selectedMenu.basePrice + extraTotal,
      options: chosenOptions,
    };
    const updatedCart = [...cart];
    const existing = updatedCart.findIndex((c) => c.menuId === selectedMenu.id);
    if (existing >= 0) {
      updatedCart[existing].quantity += 1;
    } else {
      updatedCart.push(newItem);
    }
    setCart(updatedCart);
    sessionStorage.setItem("gbrick_cart", JSON.stringify({ storeId, items: updatedCart }));
    setSelectedMenu(null);
    router.push("/gbrick/cart");
  }

  const cartTotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  // 모달에서 실시간 가격 계산
  const modalExtraTotal = selectedMenu
    ? [...selectedExtras].reduce((s, id) => {
        const opt = selectedMenu.options.find((o) => o.id === id);
        return s + (opt?.extraPrice ?? 0);
      }, 0)
    : 0;
  const modalTotal = selectedMenu ? selectedMenu.basePrice + modalExtraTotal : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-stone-400">메뉴 불러오는 중...</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col min-h-screen pb-32">
      <header
        className="flex items-center px-5 py-4 text-white"
        style={{ background: "#2C1A0E" }}
      >
        <Link href="/gbrick/stores" className="text-amber-200 mr-3 text-lg">←</Link>
        <span className="font-bold">메뉴 주문</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-xs text-amber-300">포인트 2% 적립</span>
        </div>
      </header>

      {/* Category tabs */}
      <div className="flex overflow-x-auto gap-2 px-4 py-3 bg-white border-b border-stone-100 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              background: activeCategory === cat.id ? "#2C1A0E" : "#F5F5F4",
              color: activeCategory === cat.id ? "#fff" : "#6B7280",
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu list */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        {categories
          .filter((c) => !activeCategory || c.id === activeCategory)
          .map((cat) => (
            <div key={cat.id}>
              <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                {cat.name}
              </h2>
              {cat.menus.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => openMenu(menu)}
                  disabled={menu.isSoldOut}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm border border-stone-100 mb-2 text-left disabled:opacity-40"
                >
                  <div
                    className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center text-2xl"
                    style={{ background: "#F5F0EB" }}
                  >
                    ☕
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-stone-800">{menu.name}</span>
                      {menu.isSignature && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full text-white"
                          style={{ background: "#C8873A" }}
                        >
                          시그니처
                        </span>
                      )}
                      {menu.isNew && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500 text-white">
                          NEW
                        </span>
                      )}
                      {menu.isSoldOut && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-stone-300 text-white">
                          품절
                        </span>
                      )}
                    </div>
                    {menu.description && (
                      <p className="text-xs text-stone-400 mt-0.5 truncate">{menu.description}</p>
                    )}
                    <p className="text-sm font-bold mt-1" style={{ color: "#2C1A0E" }}>
                      {menu.basePrice.toLocaleString()}원
                    </p>
                  </div>
                  <span className="text-stone-300 text-lg">+</span>
                </button>
              ))}
            </div>
          ))}
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-4 pt-2 bg-white border-t border-stone-100">
          <Link
            href="/gbrick/cart"
            onClick={() => {
              sessionStorage.setItem("gbrick_cart", JSON.stringify({ storeId, items: cart }));
            }}
            className="flex items-center justify-between px-5 py-3.5 rounded-xl text-white font-bold"
            style={{ background: "#2C1A0E" }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
              style={{ background: "#C8873A" }}
            >
              {cartCount}
            </span>
            <span>장바구니 보기</span>
            <span>{cartTotal.toLocaleString()}원</span>
          </Link>
        </div>
      )}

      {/* Menu option modal */}
      {selectedMenu && (
        <div
          className="fixed inset-0 z-[200] flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSelectedMenu(null)}
        >
          <div
            className="w-full max-w-[480px] mx-auto bg-white rounded-t-3xl px-5 pt-6"
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
            <h3 className="font-bold text-lg text-stone-800 mb-1">{selectedMenu.name}</h3>
            {selectedMenu.description && (
              <p className="text-sm text-stone-500 mb-4">{selectedMenu.description}</p>
            )}

            {/* 추가옵션 — 다중 선택 */}
            {(() => {
              const extraOpts = selectedMenu.options.filter(o => o.groupName === "추가옵션");
              if (extraOpts.length === 0) return null;
              return (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-stone-700 mb-2">추가옵션</p>
                  <div className="flex gap-2 flex-wrap">
                    {extraOpts.map((opt) => {
                      const on = selectedExtras.has(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleExtra(opt.id)}
                          className="px-4 py-2 rounded-xl text-sm border transition-colors"
                          style={{
                            background: on ? "#2C1A0E" : "#F5F5F4",
                            color: on ? "#fff" : "#374151",
                            borderColor: on ? "#2C1A0E" : "#E5E7EB",
                          }}
                        >
                          {opt.name}{opt.extraPrice > 0 && ` +${opt.extraPrice.toLocaleString()}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* 온도 — 단일 선택 */}
            {(() => {
              const tempOpts = selectedMenu.options.filter(o => o.groupName === "온도");
              if (tempOpts.length === 0) return null;
              return (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-stone-700 mb-2">온도</p>
                  <div className="flex gap-2 flex-wrap">
                    {tempOpts.map((opt) => {
                      const on = selectedOptions["온도"] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedOptions(p => ({ ...p, "온도": opt.id }))}
                          className="px-4 py-2 rounded-xl text-sm border transition-colors"
                          style={{
                            background: on ? "#2C1A0E" : "#F5F5F4",
                            color: on ? "#fff" : "#374151",
                            borderColor: on ? "#2C1A0E" : "#E5E7EB",
                          }}
                        >
                          {opt.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <button
              onClick={addToCart}
              className="w-full py-3.5 rounded-xl text-white font-bold mt-2"
              style={{ background: "#C8873A" }}
            >
              담기 · {modalTotal.toLocaleString()}원
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
