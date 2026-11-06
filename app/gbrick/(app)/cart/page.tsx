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
      <main className="flex flex-col min-h-screen pb-20">
        <header className="flex items-center px-5 py-4 text-white" style={{ background: "#2C1A0E" }}>
          <Link href="/gbrick/stores" className="text-amber-200 mr-3 text-lg">←</Link>
          <span className="font-bold">장바구니</span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-stone-400">
          <span className="text-5xl">🛒</span>
          <p className="text-sm">장바구니가 비어있습니다</p>
          <Link
            href="/gbrick/stores"
            className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
            style={{ background: "#C8873A" }}
          >
            메뉴 보러가기
          </Link>
        </div>
      </main>
    );
  }

  const subtotal = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const finalAmount = Math.max(0, subtotal - pointUse);
  const earnedPoints = Math.floor(finalAmount * 0.03);

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
      router.push(`/gbrick/history?newOrder=${data.order.orderNumber}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "주문 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col min-h-screen pb-32">
      <header className="flex items-center px-5 py-4 text-white" style={{ background: "#2C1A0E" }}>
        <Link href="/gbrick/stores" className="text-amber-200 mr-3 text-lg">←</Link>
        <span className="font-bold">장바구니</span>
      </header>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {/* Items */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {cart.items.map((item, i) => (
            <div
              key={item.menuId}
              className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-stone-100" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-stone-800">{item.menuName}</p>
                {item.options.length > 0 && (
                  <p className="text-xs text-stone-400 mt-0.5">
                    {item.options.map((o) => o.optionName).join(" · ")}
                  </p>
                )}
                <p className="text-sm font-bold mt-0.5" style={{ color: "#2C1A0E" }}>
                  {(item.unitPrice * item.quantity).toLocaleString()}원
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.menuId, -1)}
                  className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 font-bold"
                >
                  -
                </button>
                <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.menuId, 1)}
                  className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pickup name */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3">
          <label className="text-sm font-semibold text-stone-700 mb-1.5 block">픽업 이름</label>
          <input
            type="text"
            value={pickupName}
            onChange={(e) => setPickupName(e.target.value)}
            placeholder="호명될 이름을 입력해주세요"
            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3 flex flex-col gap-2">
          <div className="flex justify-between text-sm text-stone-600">
            <span>메뉴 금액</span><span>{subtotal.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-sm text-stone-600">
            <span>포인트 사용</span>
            <span>-{pointUse.toLocaleString()}원</span>
          </div>
          <div className="border-t border-stone-100 pt-2 flex justify-between font-bold text-stone-800">
            <span>결제금액</span><span>{finalAmount.toLocaleString()}원</span>
          </div>
          <p className="text-xs text-amber-600">+{earnedPoints.toLocaleString()}P 적립 예정</p>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
        )}
      </div>

      {/* Order button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-4 pt-2 bg-white border-t border-stone-100">
        <button
          onClick={handleOrder}
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-white font-bold disabled:opacity-60"
          style={{ background: "#2C1A0E" }}
        >
          {loading ? "주문 처리 중..." : `${finalAmount.toLocaleString()}원 결제하기`}
        </button>
      </div>
    </main>
  );
}
