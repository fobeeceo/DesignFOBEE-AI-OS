"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { haversineKm, formatDistance } from "@/lib/gbrick/utils/distance";

interface Store {
  id: string; name: string; address: string; status: string;
  lat?: number; lng?: number;
  operatingHours?: Record<string, { open: string; close: string }>;
}

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();

export default function GbrickHome() {
  const [stores, setStores] = useState<Store[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gbrick/stores?status=ACTIVE")
      .then(r => r.json())
      .then(d => setStores(d.stores ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      p => { setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setGpsLoading(false); },
      () => setGpsLoading(false),
      { timeout: 5000 }
    );
  }, []);

  const sortedStores = stores
    .map(s => ({ ...s, dist: userPos && s.lat && s.lng ? haversineKm(userPos.lat, userPos.lng, s.lat, s.lng) : null }))
    .sort((a, b) => (a.dist ?? 9999) - (b.dist ?? 9999));

  const nearest = sortedStores[0] ?? null;

  return (
    <main style={{ background: "#EDE3CE", minHeight: "100svh", paddingBottom: 90 }}>

      {/* ── 헤더 (베이지 배경, 흰 박스 없음) ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "calc(env(safe-area-inset-top) + 14px) 20px 14px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", width: 26, height: 32, flexShrink: 0 }}>
            <svg width="26" height="32" viewBox="0 0 60 76" fill="none">
              <path d="M30 4 C20 16 5 30 5 47 C5 61 16 73 30 73 C44 73 55 61 55 47 C55 30 40 16 30 4Z" fill="#D42B2B"/>
            </svg>
            <span style={{
              position: "absolute", left: "50%", top: "58%",
              transform: "translate(-50%, -50%)",
              color: "white", fontSize: 13, fontWeight: 900, fontFamily: "Georgia, serif",
              lineHeight: 1, userSelect: "none"
            }}>G</span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "0.04em", color: "#1A0E05" }}>G.BRICK COFFEE</span>
        </div>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          {/* QR */}
          <button aria-label="QR코드">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A0E05" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>
            </svg>
          </button>
          {/* 장바구니 */}
          <button aria-label="장바구니">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A0E05" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </button>
          {/* 알림 */}
          <Link href="/gbrick/notifications" aria-label="알림">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A0E05" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* ── 히어로 멤버십 카드 ── */}
      <section style={{ padding: "0 16px 16px" }}>
        <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: "#F5EDD8", minHeight: 190 }}>
          {/* 1/2 인디케이터 */}
          <div style={{ position: "absolute", top: 14, right: 14, zIndex: 2, background: "rgba(0,0,0,0.1)", borderRadius: 20, padding: "2px 10px" }}>
            <span style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>1/2</span>
          </div>
          {/* 배경 커피 그래픽 */}
          <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-55%)", zIndex: 1, lineHeight: 1 }}>
            <div style={{
              width: 130, height: 130, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(200,135,58,0.18), rgba(200,135,58,0.06))",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontSize: 60 }}>☕</span>
            </div>
            <p style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "#C8873A", letterSpacing: "0.08em", marginTop: 4 }}>시그니처 라떼</p>
          </div>
          {/* 텍스트 & 버튼 */}
          <div style={{ position: "relative", zIndex: 2, padding: "20px 20px 20px" }}>
            <p style={{ fontSize: 17, fontWeight: 900, color: "#1A0E05" }}>비회원</p>
            <p style={{ fontSize: 13, color: "#6B5B45", marginTop: 5, lineHeight: 1.55, maxWidth: 210 }}>
              지브릭 회원 가입하고,<br />스탬프 10개 모아<br />아메리카노 한 잔 받으세요.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              <Link href="/gbrick/login" style={{
                display: "block", textAlign: "center",
                background: "#C8873A", color: "white",
                padding: "12px 20px", borderRadius: 50,
                fontSize: 15, fontWeight: 700, letterSpacing: "0.02em",
                textDecoration: "none"
              }}>
                로그인
              </Link>
              <Link href="/gbrick/signup" style={{
                display: "block", textAlign: "center",
                background: "transparent", color: "#7A6650",
                padding: "11px 20px", borderRadius: 50,
                fontSize: 15, fontWeight: 600,
                border: "1.5px solid #C4B09A",
                textDecoration: "none"
              }}>
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 근처 매장 ── */}
      <section style={{ padding: "4px 16px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1A0E05" }}>
            {gpsLoading ? "위치 확인 중..." : nearest ? "근처 매장을 찾았어요." : "매장 안내"}
          </h2>
          <Link href="/gbrick/stores" style={{ display: "flex", alignItems: "center", color: "#C8873A", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            더보기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>

        {nearest ? (
          <NearStoreCard store={nearest} />
        ) : (
          <div style={{ background: "white", borderRadius: 16, padding: 20, textAlign: "center" }}>
            <p style={{ color: "#AAA", fontSize: 14 }}>
              {gpsLoading ? "위치 정보를 가져오는 중..." : "매장 정보를 불러오는 중..."}
            </p>
          </div>
        )}

        {/* 페이지 도트 */}
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#1A0E05" }} />
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#C8C0B4" }} />
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#C8C0B4" }} />
        </div>
      </section>

      {/* ── 프로모 배너 ── */}
      <section style={{ padding: "12px 16px 8px" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: "#1A0E05", padding: "20px 20px",
          position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.12)", borderRadius: 4, padding: "2px 7px" }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em" }}>AD</span>
          </div>
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#C8873A", letterSpacing: "0.14em" }}>NEW ARRIVAL</span>
            <p style={{ fontSize: 20, fontWeight: 900, color: "white", marginTop: 4, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              지브릭<br />시그니처 라떼
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 5 }}>스페셜티 원두 · 수제 시럽</p>
            <Link href="/gbrick/stores" style={{
              display: "inline-block", marginTop: 14,
              background: "#C8873A", color: "white",
              padding: "8px 18px", borderRadius: 50,
              fontSize: 12, fontWeight: 700, textDecoration: "none"
            }}>
              자세히 보기
            </Link>
          </div>
          <div style={{ flexShrink: 0, marginRight: 10 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(200,135,58,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontSize: 36 }}>☕</span>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

function NearStoreCard({ store }: { store: Store & { dist?: number | null } }) {
  const hours = store.operatingHours?.[TODAY];
  const isOpen = store.status === "ACTIVE";
  return (
    <div style={{ background: "white", borderRadius: 16, padding: "16px 16px 14px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* 로고 */}
        <div style={{ position: "relative", width: 54, height: 54, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="36" height="44" viewBox="0 0 60 76" fill="none">
            <path d="M30 4 C20 16 5 30 5 47 C5 61 16 73 30 73 C44 73 55 61 55 47 C55 30 40 16 30 4Z" fill="#D42B2B"/>
          </svg>
          <span style={{
            position: "absolute", left: "50%", top: "55%",
            transform: "translate(-50%, -50%)",
            color: "white", fontSize: 17, fontWeight: 900, fontFamily: "Georgia, serif",
            lineHeight: 1, userSelect: "none"
          }}>G</span>
        </div>
        {/* 정보 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ color: "#C8873A", fontSize: 14, fontWeight: 800 }}>
              {store.name.replace("GBRICK Coffee ", "")}
            </span>
            {store.dist != null && (
              <span style={{ color: "#AAA", fontSize: 13, fontWeight: 500 }}>{formatDistance(store.dist)}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#C8873A">
              <path d="M12 2C8.1 2 5 5.1 5 9c0 5.3 6.2 12.4 6.5 12.7.3.3.7.3 1 0C12.8 21.4 19 14.3 19 9c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"/>
            </svg>
            <span style={{ color: "#888", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{store.address}</span>
          </div>
          {hours && (
            <p style={{ color: "#AAA", fontSize: 12, marginTop: 1 }}>
              {isOpen ? "⬤ " : ""}
              {hours.open} ~ {hours.close}
            </p>
          )}
        </div>
      </div>
      {/* 버튼 */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 50,
            border: "1px solid #E0D8CF", fontSize: 13, color: "#888",
            background: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            cursor: "pointer"
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          새로고침
        </button>
        <Link href={`/gbrick/stores/${store.id}/menu`} style={{
          flex: 3, textAlign: "center", padding: "9px 0", borderRadius: 50,
          background: "#1A0E05", color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none"
        }}>
          테이크 아웃
        </Link>
      </div>
    </div>
  );
}
