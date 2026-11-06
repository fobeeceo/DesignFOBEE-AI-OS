"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface MenuItem {
  menuId: string;
  name: string;
  basePrice: number;
  isAvailable: boolean;
  isSoldOut: boolean;
  category: string;
}

const STORE_ID = process.env.NEXT_PUBLIC_GBRICK_STORE_ID || "store_gbrick_sinchon";

export default function StoreMenusPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "soldout">("all");

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gbrick/store/menus?storeId=${STORE_ID}`);
      const data = await res.json();
      setMenus(data.menus ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenus(); }, [fetchMenus]);

  async function toggleSoldOut(menuId: string, currentSoldOut: boolean) {
    setUpdating(menuId);
    try {
      await fetch("/api/gbrick/store/menus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: STORE_ID, menuId, isSoldOut: !currentSoldOut }),
      });
      setMenus((prev) =>
        prev.map((m) => m.menuId === menuId ? { ...m, isSoldOut: !currentSoldOut } : m)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = filter === "soldout" ? menus.filter((m) => m.isSoldOut) : menus;
  const soldOutCount = menus.filter((m) => m.isSoldOut).length;

  const grouped = filtered.reduce<Record<string, MenuItem[]>>((acc, m) => {
    const cat = m.category || "기타";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  return (
    <main className="flex flex-col min-h-screen pb-20" style={{ background: "#f8f7f5", fontFamily: "Pretendard, sans-serif" }}>
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 text-white shadow-sm" style={{ background: "#2C1A0E" }}>
        <div className="flex items-center gap-3">
          <Link href="/store/orders" className="text-amber-200 text-lg font-bold">←</Link>
          <span className="font-bold">품절 관리</span>
        </div>
        {soldOutCount > 0 && (
          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">
            품절 {soldOutCount}
          </span>
        )}
      </header>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 py-3">
        {(["all", "soldout"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold border transition"
            style={filter === f
              ? { background: "#2C1A0E", color: "#fff", border: "1px solid #2C1A0E" }
              : { background: "#fff", color: "#666", border: "1px solid #ddd" }}
          >
            {f === "all" ? `전체 (${menus.length})` : `품절 (${soldOutCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-stone-400">
          <span className="text-4xl">{filter === "soldout" ? "✅" : "☕"}</span>
          <p className="text-sm">{filter === "soldout" ? "품절 메뉴 없음" : "메뉴 없음"}</p>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-4 pt-1">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">{cat}</div>
              <div className="flex flex-col gap-2">
                {items.map((m) => (
                  <div
                    key={m.menuId}
                    className="bg-white rounded-xl border px-4 py-3 flex items-center justify-between shadow-sm"
                    style={{ borderColor: m.isSoldOut ? "#FCA5A5" : "#e5e7eb", opacity: m.isSoldOut ? 0.9 : 1 }}
                  >
                    <div>
                      <p className={`font-semibold text-sm ${m.isSoldOut ? "line-through text-stone-400" : "text-stone-800"}`}>
                        {m.name}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">{m.basePrice.toLocaleString()}원</p>
                    </div>
                    <button
                      onClick={() => toggleSoldOut(m.menuId, m.isSoldOut)}
                      disabled={updating === m.menuId}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition"
                      style={m.isSoldOut
                        ? { background: "#10B981", color: "#fff", border: "1px solid #10B981" }
                        : { background: "#FEF2F2", color: "#EF4444", border: "1px solid #FCA5A5" }}
                    >
                      {updating === m.menuId ? "..." : m.isSoldOut ? "판매 재개" : "품절 처리"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
