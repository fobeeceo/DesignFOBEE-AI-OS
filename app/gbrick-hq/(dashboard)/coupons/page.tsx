"use client";

const MOCK_COUPONS = [
  { id: "coupon_welcome", code: "WELCOME10", name: "웰컴 쿠폰", discountType: "PERCENT", discountValue: 10, minOrderAmount: 5000, maxDiscount: 2000, isActive: true, totalIssued: 487, totalUsed: 312 },
  { id: "coupon_vip", code: "VIP500", name: "VIP 500원 할인", discountType: "AMOUNT", discountValue: 500, minOrderAmount: 8000, maxDiscount: null, isActive: true, totalIssued: 150, totalUsed: 89 },
  { id: "coupon_stamp10", code: "STAMP10", name: "스탬프 10개 적립 쿠폰", discountType: "AMOUNT", discountValue: 1000, minOrderAmount: 0, maxDiscount: null, isActive: false, totalIssued: 230, totalUsed: 230 },
];

export default function CouponsPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>쿠폰 관리</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>쿠폰 발행 및 사용 현황</p>
        </div>
        <button style={{ background: "#C8873A", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
          + 쿠폰 발행
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "총 발행 쿠폰 종류", value: MOCK_COUPONS.length + "종" },
          { label: "활성 쿠폰", value: MOCK_COUPONS.filter((c) => c.isActive).length + "종" },
          { label: "총 사용 건수", value: MOCK_COUPONS.reduce((a, c) => a + c.totalUsed, 0).toLocaleString() + "건" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#2C1A0E" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {MOCK_COUPONS.map((c) => {
          const usageRate = c.totalIssued > 0 ? Math.floor(c.totalUsed / c.totalIssued * 100) : 0;
          return (
            <div key={c.id} style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", gap: 24, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontFamily: "monospace", background: "#f0ebe4", padding: "3px 10px", borderRadius: 6, fontSize: 13, fontWeight: 700, color: "#2C1A0E" }}>{c.code}</span>
                  <span style={{ fontSize: 11, background: c.isActive ? "#10B98122" : "#EF444422", color: c.isActive ? "#10B981" : "#EF4444", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                    {c.isActive ? "활성" : "비활성"}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#2C1A0E", marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {c.discountType === "PERCENT" ? `${c.discountValue}% 할인` : `${c.discountValue.toLocaleString()}원 할인`}
                  {c.minOrderAmount > 0 && ` · 최소 ${c.minOrderAmount.toLocaleString()}원`}
                  {c.maxDiscount && ` · 최대 ${c.maxDiscount.toLocaleString()}원`}
                </div>
              </div>

              <div style={{ textAlign: "center", minWidth: 100 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>사용률</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: usageRate >= 80 ? "#10B981" : "#2C1A0E" }}>{usageRate}%</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{c.totalUsed}/{c.totalIssued}</div>
              </div>

              <button style={{ background: "#f0ebe4", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 12, cursor: "pointer", color: "#666" }}>수정</button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, padding: "12px 16px", background: "#fff8f0", borderRadius: 8, fontSize: 12, color: "#C8873A" }}>
        ℹ️ 쿠폰 발행·수정 기능은 DB 연결 후 활성화됩니다.
      </div>
    </div>
  );
}
