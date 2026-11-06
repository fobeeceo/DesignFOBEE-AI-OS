"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface OrderItem { menuName: string; quantity: number; }
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  finalAmount: number;
  pickupName?: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "접수대기", CONFIRMED: "확인됨", PREPARING: "준비중",
  READY: "준비완료", PICKED_UP: "완료", CANCELLED: "취소됨",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#F59E0B", CONFIRMED: "#3B82F6", PREPARING: "#8B5CF6",
  READY: "#10B981", PICKED_UP: "#9CA3AF", CANCELLED: "#EF4444",
};

const STORE_ID = "store_gbrick_sinchon";

const NEXT_STATUS: Record<string, string | null> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "PICKED_UP",
  PICKED_UP: null,
  CANCELLED: null,
};
const NEXT_LABEL: Record<string, string> = {
  PENDING: "주문 확인",
  CONFIRMED: "준비 시작",
  PREPARING: "준비 완료",
  READY: "픽업 완료",
};

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    fetch(`/api/gbrick/store/orders?storeId=${STORE_ID}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function advanceStatus(orderId: string, currentStatus: string) {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;
    setUpdating(orderId);
    try {
      await fetch(`/api/gbrick/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  const activeOrders = orders.filter((o) => !["PICKED_UP", "CANCELLED"].includes(o.status));
  const doneOrders = orders.filter((o) => ["PICKED_UP", "CANCELLED"].includes(o.status)).slice(0, 5);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <span className="font-black text-lg tracking-widest text-stone-800">GBRICK</span>
        <span className="text-stone-300">|</span>
        <span className="text-sm font-semibold text-stone-600">주문 관리</span>
        <div className="ml-auto flex gap-3 items-center">
          <Link href="/store/checklists" className="text-sm text-stone-500">체크리스트</Link>
          <button
            onClick={fetchOrders}
            className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
          >
            새로고침
          </button>
        </div>
      </header>

      <main className="px-6 py-5">
        <h1 className="text-lg font-bold text-stone-800 mb-4">
          진행 중 ({activeOrders.length})
        </h1>

        {loading ? (
          <p className="text-sm text-stone-400">주문 불러오는 중...</p>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="text-4xl mb-3">☕</p>
            <p className="text-sm">현재 진행 중인 주문이 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-3 mb-8">
            {activeOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-stone-100 shadow-sm px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-stone-800">{order.pickupName ?? "주문자"}</p>
                    <p className="text-xs text-stone-400">{order.orderNumber}</p>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full text-white font-semibold"
                    style={{ background: STATUS_COLOR[order.status] ?? "#9CA3AF" }}
                  >
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                <p className="text-sm text-stone-700">
                  {order.items.map((i) => `${i.menuName} x${i.quantity}`).join(", ")}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-stone-400">
                    {new Date(order.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-stone-700">{order.finalAmount.toLocaleString()}원</p>
                    {NEXT_STATUS[order.status] && (
                      <button
                        onClick={() => advanceStatus(order.id, order.status)}
                        disabled={updating === order.id}
                        className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold disabled:opacity-50"
                        style={{ background: "#C8873A" }}
                      >
                        {updating === order.id ? "처리중..." : NEXT_LABEL[order.status]}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {doneOrders.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-stone-500 mb-3">최근 완료</h2>
            <div className="grid gap-2">
              {doneOrders.map((order) => (
                <div key={order.id} className="bg-stone-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-600">{order.pickupName ?? "주문자"}</p>
                    <p className="text-xs text-stone-400">{order.items.map((i) => `${i.menuName} x${i.quantity}`).join(", ")}</p>
                  </div>
                  <span className="text-xs text-stone-400">{STATUS_LABEL[order.status]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
