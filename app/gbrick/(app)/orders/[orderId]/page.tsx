"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type OrderItem = { menuName: string; quantity: number; unitPrice: number; optionName?: string };
type Order = {
  id: string;
  orderNumber: string;
  status: string;
  pickupName: string;
  finalAmount: number;
  pointsEarned: number;
  createdAt: string;
  items: OrderItem[];
  storeId: string;
};

const STATUS_INFO: Record<string, { label: string; desc: string; icon: string; color: string }> = {
  PENDING:   { label: "주문 접수", desc: "매장에서 주문을 확인하고 있어요", icon: "🕐", color: "#F59E0B" },
  CONFIRMED: { label: "주문 확인", desc: "매장에서 주문을 확인했어요", icon: "✅", color: "#3B82F6" },
  PREPARING: { label: "제조 중", desc: "음료를 만들고 있어요", icon: "☕", color: "#8B5CF6" },
  READY:     { label: "픽업 준비 완료", desc: "카운터에서 음료를 받아가세요!", icon: "🎉", color: "#10B981" },
  PICKED_UP: { label: "픽업 완료", desc: "맛있게 드세요!", icon: "😊", color: "#6B7280" },
  CANCELLED: { label: "주문 취소", desc: "주문이 취소되었습니다", icon: "❌", color: "#EF4444" },
};

const STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY", "PICKED_UP"];

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/gbrick/orders/${orderId}`);
      if (!res.ok) return;
      const data = await res.json();
      setOrder(data.order);
      if (data.order?.status === "PICKED_UP" || data.order?.status === "CANCELLED") {
        setPolling(false);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // 30초마다 폴링 (PICKED_UP/CANCELLED 아닐 때)
  useEffect(() => {
    if (!polling) return;
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [polling, load]);

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#f8f7f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#888" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>☕</div>
          <div>주문 정보를 불러오는 중...</div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main style={{ minHeight: "100vh", background: "#f8f7f5", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 32 }}>😕</div>
        <div style={{ color: "#888" }}>주문을 찾을 수 없습니다</div>
        <Link href="/gbrick" style={{ color: "#C8873A", fontSize: 14 }}>홈으로</Link>
      </main>
    );
  }

  const statusInfo = STATUS_INFO[order.status] ?? { label: order.status, desc: "", icon: "📋", color: "#888" };
  const currentStep = STEPS.indexOf(order.status);

  return (
    <main style={{ minHeight: "100vh", background: "#f8f7f5", fontFamily: "Pretendard, -apple-system, sans-serif", maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <header style={{ background: "#2C1A0E", color: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.push("/gbrick/history")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>주문 상태</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 1, fontFamily: "monospace" }}>{order.orderNumber}</div>
        </div>
      </header>

      <div style={{ padding: "24px 20px" }}>
        {/* Status Hero */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, textAlign: "center", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{statusInfo.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: statusInfo.color, marginBottom: 6 }}>{statusInfo.label}</div>
          <div style={{ fontSize: 14, color: "#888" }}>{statusInfo.desc}</div>

          {order.pickupName && (
            <div style={{ marginTop: 16, padding: "10px 20px", background: "#f8f7f5", borderRadius: 10, display: "inline-block" }}>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}>픽업 이름</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#2C1A0E" }}>{order.pickupName}</div>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        {order.status !== "CANCELLED" && (
          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 16px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {STEPS.slice(0, 4).map((step, i) => {
                const done = currentStep > i;
                const active = currentStep === i;
                const info = STATUS_INFO[step];
                return (
                  <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" }}>
                    {i < 3 && (
                      <div style={{ position: "absolute", top: 12, left: "50%", width: "100%", height: 2, background: done ? "#C8873A" : "#e8e0d8", zIndex: 0 }} />
                    )}
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: done || active ? "#C8873A" : "#e8e0d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, zIndex: 1, fontWeight: 700, color: done || active ? "#fff" : "#aaa" }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <div style={{ fontSize: 9, color: active ? "#C8873A" : done ? "#888" : "#ccc", marginTop: 6, textAlign: "center", lineHeight: 1.2 }}>
                      {info.label.replace(" 완료", "")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2C1A0E", marginBottom: 14 }}>주문 내역</div>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, color: "#2C1A0E" }}>{item.menuName}</div>
                {item.optionName && <div style={{ fontSize: 11, color: "#aaa" }}>{item.optionName}</div>}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#888" }}>×{item.quantity}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#2C1A0E" }}>{(item.unitPrice * item.quantity).toLocaleString()}원</span>
              </div>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #f0ebe4", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>합계</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#C8873A" }}>{order.finalAmount.toLocaleString()}원</span>
          </div>
          {order.pointsEarned > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#10B981", textAlign: "right" }}>+{order.pointsEarned}P 적립 예정</div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/gbrick/history" style={{ flex: 1, background: "#f0ebe4", color: "#2C1A0E", borderRadius: 12, padding: "14px", textAlign: "center", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            주문 내역
          </Link>
          <Link href="/gbrick" style={{ flex: 1, background: "#C8873A", color: "#fff", borderRadius: 12, padding: "14px", textAlign: "center", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
