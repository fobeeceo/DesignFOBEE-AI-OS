"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CartItem {
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  options: { menuOptionId: string; optionName: string; extraPrice: number }[];
}

interface CartData {
  storeId: string;
  items: CartItem[];
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [pointUse, setPointUse] = useState(0);
  const [pickupName, setPickupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("gbrick_cart");
      if (stored) setCart(JSON.parse(stored));
    } catch {}
  }, []);

  function updateQty(menuId: string, delta: number) {
    setCart((prev) => {
      if (!prev) return prev;
      const items = prev.items
        .map((i) => i.menuId === menuId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0);
      const next = { ...prev, items };
      sessionStorage.setItem("gbrick_cart", JSON.stringify(next));
      return next;
    });
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="flex flex-col min-h-screen" style={{ background: "#FAF8F5" }}>
        <header
          className="flex items-center px-4 bg-white border-b border-stone-100"
          style={{ height: 56, paddingTop: "env(safe-area-inset-top)" }}
        >
          <Link href="/gbrick/stores" className="p-1 mr-2" aria-label="뒤로">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <span className="font-bold text-base" style={{ color: "#2C1A0E" }}>장바구니</span>
        </header>

        {/* Empty cart — compose/mammoth style */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          {/* Shopping bag SVG */}
          <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
            <rect x="15" y="38" width="80" height="62" rx="6" fill="#E8E4DF"/>
            <rect x="15" y="38" width="80" height="62" rx="6" stroke="#D6D2CC" strokeWidth="1.5"/>
            <path d="M38 38V32C38 20 72 20 72 32V38" stroke="#B0A99F" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            {/* crumpled paper left */}
            <ellipse cx="34" cy="97" rx="11" ry="8" fill="#D1CBC4"/>
            <ellipse cx="34" cy="97" rx="8" ry="5.5" fill="#C8C1BB"/>
            {/* crumpled paper right */}
            <ellipse cx="76" cy="97" rx="11" ry="8" fill="#D1CBC4"/>
            <ellipse cx="76" cy="97" rx="8" ry="5.5" fill="#C8C1BB"/>
          </svg>

          <div className="text-center">
            <p className="font-bold text-stone-800 text-lg">장바구니가 비어있어요.</p>
            <p className="text-sm text-stone-400 mt-2 leading-relaxed">
              원하는 메뉴를 장바구니에 담고<br/>한 번에 주문해 보세요.
            </p>
          </div>

          <Link
            href="/gbrick/stores"
            className="w-full text-center py-4 rounded-2xl text-sm font-bold text-stone-900"
            style={{ background: "#F4C430" }}
          >
            메뉴 담으러 가기
          </Link>
        </div>
      </main>
    );
  }

  const subtotal = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const finalAmount = Math.max(0, subtotal - pointUse);
  const earnedPoints = Math.floor(finalAmount * 0.02);

  async function handleOrder() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/gbrick/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: cart!.storeId,
          items: cart!.items,
          pickupName,
          pointUsed: pointUse,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "주문 실패");

      sessionStorage.removeItem("gbrick_cart");
      if (data.order?.mock) {
        sessionStorage.setItem(`gbrick_order_${data.order.id}`, JSON.stringify(data.order));
      }
      router.push(`/gbrick/orders/${data.order.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "주문 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col min-h-screen pb-32" style={{ background: "#FAF8F5" }}>
      <header
        className="flex items-center px-4 bg-white border-b border-stone-100"
        style={{ height: 56, paddingTop: "env(safe-area-inset-top)" }}
      >
        <Link href="/gbrick/stores" className="p-1 mr-2" aria-label="뒤로">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <span className="font-bold text-base" style={{ color: "#2C1A0E" }}>장바구니</span>
      </header>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {/* Items */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {cart.items.map((item, i) => (
            <div
              key={item.menuId}
              className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-stone-100" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-stone-800">{item.menuName}</p>
                {item.options.length > 0 && (
                  <p className="text-xs text-stone-400 mt-0.5">
                    {item.options.map(o => o.optionName).join(" · ")}
                  </p>
                )}
                <p className="text-sm font-bold mt-0.5" style={{ color: "#2C1A0E" }}>
                  {(item.unitPrice * item.quantity).toLocaleString()}원
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => updateQty(item.menuId, -1)}
                  className="w-8 h-8 rounded-full border border-stone-200 text-stone-600 font-bold flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.menuId, 1)}
                  className="w-8 h-8 rounded-full border border-stone-200 text-stone-600 font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pickup name */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3.5">
          <label className="text-sm font-semibold text-stone-700 mb-2 block">픽업 이름</label>
          <input
            type="text"
            value={pickupName}
            onChange={e => setPickupName(e.target.value)}
            placeholder="호명될 이름을 입력해주세요"
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3.5 flex flex-col gap-2.5">
          <div className="flex justify-between text-sm text-stone-600">
            <span>메뉴 금액</span>
            <span>{subtotal.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-sm text-stone-600">
            <span>포인트 사용</span>
            <span>-{pointUse.toLocaleString()}원</span>
          </div>
          <div className="border-t border-stone-100 pt-2.5 flex justify-between font-bold text-stone-800">
            <span>결제금액</span>
            <span>{finalAmount.toLocaleString()}원</span>
          </div>
          <p className="text-xs font-semibold" style={{ color: "#C8873A" }}>
            +{earnedPoints.toLocaleString()}P 적립 예정
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}
      </div>

      {/* Order button */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pt-3 bg-white border-t border-stone-100"
        style={{ zIndex: 100, paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <button
          onClick={handleOrder}
          disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-60"
          style={{ background: "#2C1A0E" }}
        >
          {loading ? "주문 처리 중..." : `${finalAmount.toLocaleString()}원 결제하기`}
        </button>
      </div>
    </main>
  );
}
