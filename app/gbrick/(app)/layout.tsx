"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GbrickAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isHome = pathname === "/gbrick";
  const isLab = pathname.startsWith("/gbrick/lab");
  const isOrder = pathname.startsWith("/gbrick/stores");
  const isGift = pathname.startsWith("/gbrick/gift");
  const isMore = pathname.startsWith("/gbrick/mypage");

  const ic = (on: boolean) => on ? "#1A0E05" : "#BBBBBB";

  return (
    <>
      <div>{children}</div>
      <nav
        style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480, background: "white", zIndex: 50,
          borderTop: "1px solid #EFEFEF", boxShadow: "0 -2px 16px rgba(0,0,0,0.06)",
          paddingBottom: "env(safe-area-inset-bottom)"
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", height: 62 }}>

          {/* 홈 */}
          <Link href="/gbrick" style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            paddingBottom: 10, paddingTop: 12, gap: 3, textDecoration: "none"
          }}>
            <svg width="23" height="23" viewBox="0 0 24 24"
              fill={isHome ? "#1A0E05" : "none"} stroke={ic(isHome)}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span style={{ fontSize: "9.5px", fontWeight: 600, color: ic(isHome) }}>홈</span>
          </Link>

          {/* 실험실 */}
          <Link href="/gbrick/lab" style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            paddingBottom: 10, paddingTop: 10, gap: 2, textDecoration: "none", position: "relative"
          }}>
            <div style={{
              position: "absolute", top: 7, left: "50%",
              transform: "translateX(2px)",
              background: "#E8E8E8", borderRadius: 20, padding: "1px 5px"
            }}>
              <span style={{ fontSize: 7.5, color: "#999", fontWeight: 700, letterSpacing: "0.02em" }}>준비중</span>
            </div>
            <svg width="23" height="23" viewBox="0 0 24 24"
              fill="none" stroke={ic(isLab)}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11M9 14l-2 2m2-2l2 2M5 9h14"/>
              <path d="M5 14s1 0 2 1 4 1 4 1 3 0 4-1 2-1 2-1"/>
            </svg>
            <span style={{ fontSize: "9.5px", fontWeight: 600, color: ic(isLab) }}>실험실</span>
          </Link>

          {/* 주문 — 솟은 원형 버튼 (컴포즈커피 스타일) */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <Link href="/gbrick/stores" style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 3, position: "absolute", bottom: 10, textDecoration: "none"
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: isOrder ? "#1A0E05" : "#C8873A",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(200,135,58,0.45)",
                marginBottom: -4
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24"
                  fill="none" stroke="white"
                  strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 010 8h-1"/>
                  <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
                  <line x1="6" y1="1" x2="6" y2="4"/>
                  <line x1="10" y1="1" x2="10" y2="4"/>
                  <line x1="14" y1="1" x2="14" y2="4"/>
                </svg>
              </div>
              <span style={{ fontSize: "9.5px", fontWeight: 700, color: isOrder ? "#1A0E05" : "#C8873A" }}>주문</span>
            </Link>
          </div>

          {/* 선물하기 */}
          <Link href="/gbrick/gift" style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            paddingBottom: 10, paddingTop: 12, gap: 3, textDecoration: "none"
          }}>
            <svg width="23" height="23" viewBox="0 0 24 24"
              fill="none" stroke={ic(isGift)}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12"/>
              <rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
            </svg>
            <span style={{ fontSize: "9.5px", fontWeight: 600, color: ic(isGift) }}>선물하기</span>
          </Link>

          {/* 더보기 */}
          <Link href="/gbrick/mypage" style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            paddingBottom: 10, paddingTop: 12, gap: 3, textDecoration: "none"
          }}>
            <svg width="23" height="23" viewBox="0 0 24 24"
              fill="none" stroke={ic(isMore)}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <span style={{ fontSize: "9.5px", fontWeight: 600, color: ic(isMore) }}>더보기</span>
          </Link>

        </div>
      </nav>
    </>
  );
}
