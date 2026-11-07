"use client";

/**
 * 매장 PC 주문 수신 화면
 * - 5초마다 새 주문 자동 조회
 * - 새 주문 도착 시 알림음 + 화면 강조
 * - 브라우저 프린트로 영수증 출력
 * 사용법: /gbrick/store-pos/[storeId] 를 매장 PC에서 열어두기
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface OrderItem {
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  options?: { optionName: string; extraPrice: number }[];
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  pickupName: string;
  finalAmount: number;
  note?: string;
  items: OrderItem[];
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "접수 대기",
  ACCEPTED: "제조 중",
  READY: "픽업 대기",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#D42B2B",
  ACCEPTED: "#C8873A",
  READY: "#16A34A",
  COMPLETED: "#9CA3AF",
  CANCELLED: "#6B7280",
};

export default function StorePosPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCount, setLastCount] = useState(0);
  const [newAlert, setNewAlert] = useState(false);
  const [printTarget, setPrintTarget] = useState<Order | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const audioCtx = useRef<AudioContext | null>(null);

  function playBeep() {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      const ctx = audioCtx.current;
      [0, 150, 300].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay / 1000);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.15);
        osc.start(ctx.currentTime + delay / 1000);
        osc.stop(ctx.currentTime + delay / 1000 + 0.15);
      });
    } catch {}
  }

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/gbrick/store/orders?storeId=${storeId}&status=PENDING`);
      if (!res.ok) return;
      const data = await res.json();
      const incoming: Order[] = data.orders ?? [];

      // 신규 주문 감지
      const newOnes = incoming.filter((o) => !knownIds.current.has(o.id));
      if (newOnes.length > 0) {
        newOnes.forEach((o) => knownIds.current.add(o.id));
        playBeep();
        setNewAlert(true);
        setTimeout(() => setNewAlert(false), 4000);
      }

      setOrders(incoming);
      setLastCount(incoming.length);
    } catch {}
    finally { setLoading(false); }
  }, [storeId]);

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 5000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  async function updateStatus(orderId: string, status: string) {
    await fetch(`/api/gbrick/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  }

  function printOrder(order: Order) {
    setPrintTarget(order);
    setTimeout(() => { window.print(); setPrintTarget(null); }, 300);
  }

  const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* ── 프린트 전용 영수증 ── */}
      {printTarget && (
        <div className="print-only" style={{ fontFamily: "monospace", fontSize: 13, padding: 8, width: 280 }}>
          <div style={{ textAlign: "center", fontWeight: 900, fontSize: 16, marginBottom: 4 }}>G.BRICK COFFEE</div>
          <div style={{ textAlign: "center", fontSize: 11, marginBottom: 8 }}>주문번호: {printTarget.orderNumber}</div>
          <div style={{ borderTop: "1px dashed #000", marginBottom: 8 }} />
          <div style={{ marginBottom: 4 }}>픽업명: <strong>{printTarget.pickupName || "손님"}</strong></div>
          <div style={{ marginBottom: 8, fontSize: 11, color: "#666" }}>
            {new Date(printTarget.createdAt).toLocaleString("ko-KR")}
          </div>
          <div style={{ borderTop: "1px dashed #000", marginBottom: 6 }} />
          {printTarget.items.map((item, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{item.menuName} x{item.quantity}</span>
                <span>{(item.unitPrice * item.quantity).toLocaleString()}원</span>
              </div>
              {item.options?.map((o) => (
                <div key={o.optionName} style={{ fontSize: 11, color: "#555", paddingLeft: 8 }}>
                  + {o.optionName} {o.extraPrice > 0 ? `(+${o.extraPrice}원)` : ""}
                </div>
              ))}
            </div>
          ))}
          <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
          {printTarget.note && <div style={{ fontSize: 11, marginBottom: 6 }}>요청: {printTarget.note}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 15 }}>
            <span>합계</span><span>{printTarget.finalAmount.toLocaleString()}원</span>
          </div>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 11 }}>이용해 주셔서 감사합니다</div>
        </div>
      )}

      {/* ── 화면 UI (프린트 시 숨김) ── */}
      <div className="no-print" style={{ minHeight: "100vh", background: "#F5F0EB" }}>
        {/* 헤더 */}
        <header style={{
          background: "#1A0E05", color: "white",
          padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", width: 28, height: 34 }}>
              <svg width="28" height="34" viewBox="0 0 60 76" fill="none">
                <path d="M30 4 C20 16 5 30 5 47 C5 61 16 73 30 73 C44 73 55 61 55 47 C55 30 40 16 30 4Z" fill="#D42B2B"/>
              </svg>
              <span style={{ position:"absolute",left:"50%",top:"58%",transform:"translate(-50%,-50%)",color:"white",fontSize:12,fontWeight:900,fontFamily:"Georgia,serif" }}>G</span>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: "0.04em" }}>G.BRICK COFFEE</div>
              <div style={{ fontSize: 11, color: "#C8873A" }}>매장 주문 수신</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace" }}>{now}</div>
            <div style={{ fontSize: 12, color: "#C8873A" }}>
              대기 주문 {lastCount}건
              <span style={{
                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                background: "#22C55E", marginLeft: 6,
                animation: "pulse 2s infinite"
              }}/>
            </div>
          </div>
        </header>

        {/* 신규 주문 알림 배너 */}
        {newAlert && (
          <div style={{
            background: "#D42B2B", color: "white", padding: "14px 24px",
            fontSize: 18, fontWeight: 900, textAlign: "center",
            animation: "blink 0.5s ease-in-out 6"
          }}>
            🔔 새 주문이 들어왔습니다!
          </div>
        )}

        {/* 주문 목록 */}
        <div style={{ padding: "20px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#9CA3AF", padding: 60, fontSize: 16 }}>
              주문 조회 중...
            </div>
          ) : orders.length === 0 ? (
            <div style={{
              textAlign: "center", color: "#9CA3AF", padding: 80, fontSize: 16,
              background: "white", borderRadius: 20
            }}>
              대기 중인 주문이 없습니다<br/>
              <span style={{ fontSize: 13, marginTop: 8, display: "block" }}>5초마다 자동 새로고침</span>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {orders.map((order) => (
                <div key={order.id} style={{
                  background: "white", borderRadius: 20, padding: 20,
                  boxShadow: order.status === "PENDING" ? "0 0 0 3px #D42B2B" : "0 2px 8px rgba(0,0,0,0.08)",
                }}>
                  {/* 주문 헤더 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 18, color: "#1A0E05" }}>
                        {order.pickupName || "손님"}
                      </div>
                      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                        #{order.orderNumber}
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 12px", borderRadius: 50,
                      background: STATUS_COLOR[order.status] ?? "#9CA3AF",
                      color: "white", fontSize: 13, fontWeight: 700
                    }}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </div>
                  </div>

                  {/* 메뉴 목록 */}
                  <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 12, marginBottom: 12 }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
                          <span>{item.menuName} × {item.quantity}</span>
                          <span>{(item.unitPrice * item.quantity).toLocaleString()}원</span>
                        </div>
                        {item.options?.map((o) => (
                          <div key={o.optionName} style={{ fontSize: 12, color: "#6B7280", paddingLeft: 8 }}>
                            + {o.optionName}
                            {o.extraPrice > 0 && ` (+${o.extraPrice}원)`}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* 요청 사항 */}
                  {order.note && (
                    <div style={{
                      background: "#FEF3C7", borderRadius: 10, padding: "8px 12px",
                      fontSize: 13, color: "#92400E", marginBottom: 12
                    }}>
                      📝 {order.note}
                    </div>
                  )}

                  {/* 합계 + 버튼 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontSize: 14, color: "#6B7280" }}>합계</span>
                    <span style={{ fontWeight: 900, fontSize: 18, color: "#1A0E05" }}>
                      {order.finalAmount.toLocaleString()}원
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => printOrder(order)}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 12, border: "1.5px solid #E5E7EB",
                        background: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#374151"
                      }}
                    >
                      🖨 출력
                    </button>
                    {order.status === "PENDING" && (
                      <button
                        onClick={() => updateStatus(order.id, "ACCEPTED")}
                        style={{
                          flex: 2, padding: "10px 0", borderRadius: 12, border: "none",
                          background: "#C8873A", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        제조 시작
                      </button>
                    )}
                    {order.status === "ACCEPTED" && (
                      <button
                        onClick={() => updateStatus(order.id, "READY")}
                        style={{
                          flex: 2, padding: "10px 0", borderRadius: 12, border: "none",
                          background: "#16A34A", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        ✓ 픽업 준비 완료
                      </button>
                    )}
                    {order.status === "READY" && (
                      <button
                        onClick={() => updateStatus(order.id, "COMPLETED")}
                        style={{
                          flex: 2, padding: "10px 0", borderRadius: 12, border: "none",
                          background: "#1A0E05", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        완료
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "right", marginTop: 8 }}>
                    {new Date(order.createdAt).toLocaleTimeString("ko-KR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>
    </>
  );
}
