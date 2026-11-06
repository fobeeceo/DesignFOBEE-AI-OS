"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface OrderItem { menuName: string; quantity: number; }
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  finalAmount: number;
  createdAt: string;
  items: OrderItem[];
  store?: { name: string };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기중", CONFIRMED: "확인됨", PREPARING: "준비중",
  READY: "준비완료", PICKED_UP: "픽업완료", CANCELLED: "취소됨", REFUNDED: "환불됨",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#F59E0B", CONFIRMED: "#3B82F6", PREPARING: "#8B5CF6",
  READY: "#10B981", PICKED_UP: "#6B7280", CANCELLED: "#EF4444", REFUNDED: "#EF4444",
};

function HistoryContent() {
  const searchParams = useSearchParams();
  const newOrder = searchParams.get("newOrder");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gbrick/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex flex-col min-h-screen pb-20">
      <header className="flex items-center px-5 py-4 text-white" style={{ background: "#2C1A0E" }}>
        <Link href="/gbrick" className="text-amber-200 mr-3 text-lg">←</Link>
        <span className="font-bold">주문 내역</span>
      </header>

      {newOrder && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-2xl bg-green-50 border border-green-200">
          <p className="text-sm font-semibold text-green-700">주문이 접수되었습니다 🎉</p>
          <p className="text-xs text-green-500 mt-0.5">주문번호: {newOrder}</p>
        </div>
      )}

      <div className="px-4 pt-4 flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-stone-400 text-center py-10">주문 내역 불러오는 중...</p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-stone-400">
            <span className="text-5xl">📋</span>
            <p className="text-sm">주문 내역이 없습니다</p>
            <Link
              href="/gbrick/stores"
              className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
              style={{ background: "#C8873A" }}
            >
              첫 주문하기
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-stone-400">{order.store?.name ?? "지브릭커피"}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ background: STATUS_COLOR[order.status] ?? "#9CA3AF" }}
                >
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-stone-800">
                {order.items.map((i) => `${i.menuName} x${i.quantity}`).join(", ")}
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-stone-400">주문번호 {order.orderNumber}</p>
                <p className="font-bold text-sm" style={{ color: "#2C1A0E" }}>
                  {order.finalAmount.toLocaleString()}원
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-stone-400">로딩 중...</div>}>
      <HistoryContent />
    </Suspense>
  );
}
