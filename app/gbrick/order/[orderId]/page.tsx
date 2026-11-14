"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type OrderStatus = "PENDING" | "CONFIRMED" | "READY" | "COMPLETED" | "CANCELLED";

interface OrderItem {
  menuName: string;
  quantity: number;
  unitPrice: number;
  optionName?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  status: OrderStatus;
  pickupName: string;
  finalAmount: number;
  pointsEarned: number;
  createdAt: string;
  items: OrderItem[];
}

const STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: "PENDING", label: "주문접수", icon: "📋" },
  { status: "CONFIRMED", label: "준비중", icon: "☕" },
  { status: "READY", label: "픽업대기", icon: "✅" },
  { status: "COMPLETED", label: "픽업완료", icon: "🎉" },
];

function getStepIndex(status: OrderStatus): number {
  if (status === "CANCELLED") return -1;
  return STEPS.findIndex((s) => s.status === status);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatPrice(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

export default function OrderStatusPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/gbrick/orders/${orderId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("주문을 찾을 수 없습니다.");
        } else {
          setError("주문 정보를 불러오지 못했습니다.");
        }
        return;
      }
      const data = await res.json();
      setOrder(data.order);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    const timer = setInterval(fetchOrder, 5_000);
    return () => clearInterval(timer);
  }, [fetchOrder]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-gray-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">☕</div>
          <p className="text-gray-500">주문 정보 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const stepIndex = getStepIndex(order.status);
  const isCancelled = order.status === "CANCELLED";
  const isCompleted = order.status === "COMPLETED";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div
        className="text-white px-4 pt-10 pb-6"
        style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #3d2f1f 100%)" }}
      >
        <p className="text-xs text-gray-400 mb-1">GBRICK Coffee</p>
        <h1 className="text-2xl font-black tracking-tight">주문 현황</h1>
        <p className="text-sm text-gray-300 mt-1">
          주문번호 {order.orderNumber}
        </p>
      </div>

      {/* 메인 카드 */}
      <div className="px-4 -mt-2">
        {isCancelled ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="text-5xl mb-3">❌</div>
            <p className="text-xl font-black text-red-600 mb-1">주문 취소됨</p>
            <p className="text-sm text-gray-500">문의: 매장으로 연락해 주세요</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            {/* 현재 상태 큰 텍스트 */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-2">{STEPS[stepIndex]?.icon ?? "☕"}</div>
              <p className="text-2xl font-black text-gray-900">
                {STEPS[stepIndex]?.label ?? order.status}
              </p>
              {order.status === "READY" && (
                <p className="text-sm font-bold text-amber-600 mt-1 animate-pulse">
                  카운터에서 픽업해 주세요 🛎
                </p>
              )}
              {isCompleted && (
                <p className="text-sm text-gray-500 mt-1">감사합니다! 맛있게 드세요 😊</p>
              )}
            </div>

            {/* 스텝 진행 바 */}
            <div className="flex items-start justify-between relative mb-2">
              {/* 연결선 */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 z-0" />
              <div
                className="absolute top-4 left-6 h-0.5 z-0 transition-all duration-700"
                style={{
                  background: "#d97706",
                  width:
                    stepIndex === 0
                      ? "0%"
                      : stepIndex === 1
                      ? "33.33%"
                      : stepIndex === 2
                      ? "66.66%"
                      : "100%",
                  right: "auto",
                }}
              />

              {STEPS.map((step, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <div key={step.status} className="flex flex-col items-center z-10 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 ${
                        done
                          ? "bg-amber-700 text-white"
                          : active
                          ? "bg-amber-500 text-white shadow-lg scale-110"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <p
                      className={`text-xs mt-1 font-bold text-center leading-tight ${
                        active ? "text-amber-600" : done ? "text-amber-800" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 주문자 정보 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mt-3 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <p className="text-xs text-gray-400">픽업 이름</p>
            <p className="text-lg font-black text-gray-900">{order.pickupName || "손님"}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400">주문 시간</p>
            <p className="text-sm font-bold text-gray-700">{formatTime(order.createdAt)}</p>
          </div>
        </div>

        {/* 주문 항목 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mt-3">
          <p className="text-sm font-black text-gray-700 mb-3">주문 내역</p>
          <div className="flex flex-col gap-3">
            {order.items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">항목 정보 없음</p>
            ) : (
              order.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      {item.menuName}
                      <span className="ml-1 text-gray-500 font-normal">×{item.quantity}</span>
                    </p>
                    {item.optionName && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.optionName}</p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-800 ml-2">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
            <p className="text-sm font-black text-gray-700">합계</p>
            <p className="text-lg font-black text-gray-900">{formatPrice(order.finalAmount)}</p>
          </div>
          {order.pointsEarned > 0 && (
            <p className="text-xs text-amber-600 font-bold text-right mt-1">
              +{order.pointsEarned.toLocaleString()} 포인트 적립 예정
            </p>
          )}
        </div>

        {/* 자동 갱신 안내 */}
        <p className="text-center text-xs text-gray-400 mt-4 mb-8">
          5초마다 자동으로 갱신됩니다 · {lastUpdated.toLocaleTimeString("ko-KR")} 기준
        </p>
      </div>
    </div>
  );
}
