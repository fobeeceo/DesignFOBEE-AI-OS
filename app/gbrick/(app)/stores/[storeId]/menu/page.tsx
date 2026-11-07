"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
  const storeId = params.storeId as string;
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

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
    setSelectedMenu(menu);
    const defaults: Record<string, string> = {};
    const groups = [...new Set(menu.options.map((o) => o.groupName ?? "default"))];
    groups.forEach((g) => {
      const def = menu.options.find((o) => (o.groupName ?? "default") === g && o.isDefault);
      if (def) defaults[g] = def.id;
    });
    setSelectedOptions(defaults);
  }

  function addToCart() {
    if (!selectedMenu) return;
    const chosenOptions = Object.values(selectedOptions).map((optId) => {
      const opt = selectedMenu.options.find((o) => o.id === optId)!;
      return { menuOptionId: opt.id, optionName: opt.name, extraPrice: opt.extraPrice };
    });
    const extraTotal = chosenOptions.reduce((s, o) => s + o.extraPrice, 0);
    setCart((prev) => {
      const existing = prev.findIndex((c) => c.menuId === selectedMenu.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          menuId: selectedMenu.id,
          menuName: selectedMenu.name,
          quantity: 1,
          unitPrice: selectedMenu.basePrice + extraTotal,
          options: chosenOptions,
        },
      ];
    });
    setSelectedMenu(null);
  }

  const cartTotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

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
                {cat.name} <span className="text-red-500">({cat.menus.length})</span>
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
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSelectedMenu(null)}
        >
          <div
            className="w-full max-w-[480px] mx-auto bg-white rounded-t-3xl px-5 pt-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
            <h3 className="font-bold text-lg text-stone-800 mb-1">{selectedMenu.name}</h3>
            {selectedMenu.description && (
              <p className="text-sm text-stone-500 mb-4">{selectedMenu.description}</p>
            )}

            {Object.entries(
              selectedMenu.options.reduce((acc, opt) => {
                const g = opt.groupName ?? "옵션";
                if (!acc[g]) acc[g] = [];
                acc[g].push(opt);
                return acc;
              }, {} as Record<string, MenuOption[]>)
            ).map(([group, opts]) => (
              <div key={group} className="mb-4">
                <p className="text-sm font-semibold text-stone-700 mb-2">{group}</p>
                <div className="flex gap-2 flex-wrap">
                  {opts.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() =>
                        setSelectedOptions((prev) => ({ ...prev, [group]: opt.id }))
                      }
                      className="px-4 py-2 rounded-xl text-sm border transition-colors"
                      style={{
                        background: selectedOptions[group] === opt.id ? "#2C1A0E" : "#F5F5F4",
                        color: selectedOptions[group] === opt.id ? "#fff" : "#374151",
                        borderColor: selectedOptions[group] === opt.id ? "#2C1A0E" : "#E5E7EB",
                      }}
                    >
                      {opt.name}
                      {opt.extraPrice > 0 && ` +${opt.extraPrice.toLocaleString()}`}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={addToCart}
              className="w-full py-3.5 rounded-xl text-white font-bold mt-2"
              style={{ background: "#C8873A" }}
            >
              담기 · {selectedMenu.basePrice.toLocaleString()}원
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
