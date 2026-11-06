"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  finalAmount: number;
  pickupName?: string;
  createdAt: string;
  items: { menuName: string; quantity: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기중", CONFIRMED: "확인됨", PREPARING: "준비중",
  READY: "준비완료", PICKED_UP: "완료", CANCELLED: "취소됨",
};

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: storeId는 세션에서 가져옴
    fetch("/api/gbrick/orders?role=store")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center gap-4">
        <span className="font-black text-lg tracking-widest text-stone-800">GBRICK</span>
        <span className="text-stone-300">|</span>
        <span className="text-sm font-semibold text-stone-600">주문 관리</span>
        <div className="ml-auto flex gap-3">
          <Link href="/store/(dashboard)/menu" className="text-sm text-stone-500">메뉴</Link>
        </div>
      </header>

      <main className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-stone-800">실시간 주문</h1>
          <button
            onClick={() => window.location.reload()}
            className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600"
          >
            새로고침
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-stone-400">주문 불러오는 중...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="text-4xl mb-3">☕</p>
            <p className="text-sm">현재 주문이 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-stone-100 shadow-sm px-5 py-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-stone-800">{order.pickupName ?? "주문자"}</p>
                    <p className="text-xs text-stone-400">{order.orderNumber}</p>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full text-white font-semibold"
                    style={{
                      background:
                        order.status === "PENDING" ? "#F59E0B" :
                        order.status === "PREPARING" ? "#8B5CF6" :
                        order.status === "READY" ? "#10B981" : "#9CA3AF",
                    }}
                  >
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                <p className="text-sm text-stone-700">
                  {order.items.map((i) => `${i.menuName} x${i.quantity}`).join(", ")}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-stone-400">
                    {new Date(order.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-sm font-bold text-stone-700">{order.finalAmount.toLocaleString()}원</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
