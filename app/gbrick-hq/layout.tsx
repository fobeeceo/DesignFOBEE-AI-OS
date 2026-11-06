"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/gbrick-hq/dashboard", label: "대시보드", icon: "📊" },
  { href: "/gbrick-hq/stores", label: "매장 관리", icon: "🏪" },
  { href: "/gbrick-hq/menus", label: "메뉴 관리", icon: "☕" },
  { href: "/gbrick-hq/orders", label: "주문 현황", icon: "📋" },
  { href: "/gbrick-hq/customers", label: "고객 관리", icon: "👥" },
  { href: "/gbrick-hq/points", label: "포인트", icon: "💎" },
  { href: "/gbrick-hq/coupons", label: "쿠폰", icon: "🎟️" },
  { href: "/gbrick-hq/notices", label: "공지사항", icon: "📢" },
  { href: "/gbrick-hq/ai", label: "AI 브리핑", icon: "🤖" },
];

export default function GbrickHqLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Pretendard, -apple-system, sans-serif", background: "#f8f7f5" }}>
      <aside style={{ width: 220, background: "#2C1A0E", color: "#fff", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50 }}>
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 10, color: "#C8873A", fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>HQ ADMIN</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>GBRICK Coffee</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>프랜차이즈 본사</div>
        </div>

        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 20px",
                  color: active ? "#C8873A" : "rgba(255,255,255,0.7)",
                  background: active ? "rgba(200,135,58,0.15)" : "transparent",
                  borderLeft: active ? "3px solid #C8873A" : "3px solid transparent",
                  textDecoration: "none",
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <Link href="/gbrick" style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", textDecoration: "none", marginBottom: 4 }}>← 고객 앱</Link>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>© 2026 GBRICK Coffee</div>
        </div>
      </aside>

      <main style={{ marginLeft: 220, flex: 1, minHeight: "100vh", padding: "32px 36px" }}>
        {children}
      </main>
    </div>
  );
}
