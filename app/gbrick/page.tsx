"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { haversineKm, formatDistance } from "@/lib/gbrick/utils/distance";

interface Store {
  id: string;
  name: string;
  address: string;
  status: string;
  lat?: number;
  lng?: number;
  operatingHours?: Record<string, { open: string; close: string }>;
}

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();

export default function GbrickHome() {
  const [stores, setStores] = useState<Store[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gbrick/stores?status=ACTIVE")
      .then((r) => r.json())
      .then((d) => setStores(d.stores ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setGpsLoading(false); },
      () => setGpsLoading(false),
      { timeout: 5000 }
    );
  }, []);

  const nearest = stores
    .map((s) => ({ ...s, dist: userPos && s.lat && s.lng ? haversineKm(userPos.lat, userPos.lng, s.lat, s.lng) : null }))
    .sort((a, b) => (a.dist ?? 9999) - (b.dist ?? 9999))[0] ?? null;

  return (
    <main className="flex flex-col pb-24" style={{ background: "#F7F4F0", minHeight: "100svh" }}>

      {/* ── 상단 바 ── */}
      <header className="flex items-center justify-between bg-white px-5 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)" }}>
        <div className="flex flex-col leading-tight">
          <span className="text-[22px] font-black tracking-[0.12em]" style={{ color: "#1A0E05" }}>GBRICK</span>
          <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "#C8873A", marginTop: -2 }}>COFFEE</span>
        </div>
        <div className="flex items-center gap-5">
          {/* QR */}
          <button aria-label="QR">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A0E05" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>
            </svg>
          </button>
          {/* 알림 */}
          <Link href="/gbrick/notifications" aria-label="알림">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A0E05" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* ── 스탬프 카드 (비회원) ── */}
      <section className="px-4 pt-4 pb-1">
        <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1A0E05 0%, #3D2210 100%)" }}>
          {/* 상단 문구 */}
          <div className="flex items-start justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-[11px] font-semibold tracking-wide" style={{ color: "#C8873A" }}>GBRICK MEMBERSHIP</p>
              <p className="text-white font-bold text-base mt-0.5 leading-snug">
                스탬프 10개 모으면<br/>아메리카노 1잔 무료
              </p>
            </div>
            <Link
              href="/gbrick/login"
              className="text-[11px] font-bold px-3 py-1.5 rounded-full"
              style={{ background: "#C8873A", color: "#fff" }}
            >
              로그인
            </Link>
          </div>

          {/* 스탬프 도트 */}
          <div className="px-5 pb-2">
            <div className="flex gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 aspect-square rounded-full border-[1.5px] flex items-center justify-center"
                  style={{ borderColor: i < 3 ? "#C8873A" : "rgba(255,255,255,0.2)", background: i < 3 ? "#C8873A" : "transparent" }}>
                  {i < 3 && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C9.3 2 7 4.3 7 7c0 2.9 2.4 5.3 5 7.4 2.6-2.1 5-4.5 5-7.4C17 4.3 14.7 2 12 2z"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-2 pb-4" style={{ color: "rgba(255,255,255,0.45)" }}>3 / 10 스탬프 적립 중</p>
          </div>
        </div>
      </section>

      {/* ── 근처 매장 ── */}
      <section className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8873A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <h2 className="text-[15px] font-bold" style={{ color: "#1A0E05" }}>
              {gpsLoading ? "위치 확인 중..." : nearest ? "근처 매장을 찾았어요" : "매장 안내"}
            </h2>
          </div>
          <Link href="/gbrick/stores" className="text-[12px] font-semibold flex items-center gap-0.5" style={{ color: "#C8873A" }}>
            전체 보기
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>

        {nearest ? (
          <NearStoreCard store={nearest} />
        ) : (
          <div className="bg-white rounded-2xl p-5 text-center border border-stone-100">
            <p className="text-sm text-stone-400">{gpsLoading ? "위치 정보를 가져오는 중..." : "근처 매장 정보를 불러오는 중..."}</p>
          </div>
        )}
      </section>

      {/* ── 프로모션 배너 ── */}
      <section className="px-4 pt-5">
        <div className="rounded-2xl flex items-center justify-between px-5 py-4 relative overflow-hidden"
          style={{ background: "linear-gradient(120deg, #FFF3E0 0%, #FFE0B2 100%)" }}>
          <div className="z-10">
            <span className="text-[10px] font-bold tracking-widest" style={{ color: "#C8873A" }}>NEW ARRIVAL</span>
            <p className="text-sm font-bold mt-0.5 leading-snug" style={{ color: "#1A0E05" }}>
              지브릭 시그니처 라떼<br/>
              <span className="text-xs font-normal text-stone-600">스페셜티 원두 · 수제 시럽</span>
            </p>
            <Link href="/gbrick/stores"
              className="inline-block mt-3 text-[11px] font-bold px-3 py-1.5 rounded-full"
              style={{ background: "#1A0E05", color: "#fff" }}>
              지금 주문
            </Link>
          </div>
          {/* 커피컵 아이콘 */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ background: "rgba(200,135,58,0.15)" }}>
            ☕
          </div>
        </div>
      </section>

      {/* ── 빠른 메뉴 ── */}
      <section className="px-4 pt-5">
        <h2 className="text-[14px] font-bold mb-3" style={{ color: "#1A0E05" }}>빠른 메뉴</h2>
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { label: "주문하기", href: "/gbrick/stores", icon: (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C8873A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
                <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
              </svg>
            )},
            { label: "선물하기", href: "/gbrick/gift", icon: (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C8873A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
                <line x1="12" y1="22" x2="12" y2="7"/>
                <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
              </svg>
            )},
            { label: "쿠폰함", href: "/gbrick/coupons", icon: (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C8873A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            )},
            { label: "내 정보", href: "/gbrick/mypage", icon: (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C8873A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            )},
          ].map((item) => (
            <Link key={item.label} href={item.href}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-white border border-stone-100 shadow-sm">
              {item.icon}
              <span className="text-[11px] font-semibold text-stone-600">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 공지 ── */}
      <section className="px-4 pt-5 pb-2">
        <div className="bg-white rounded-xl px-4 py-3 border border-stone-100 flex items-center gap-3">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 text-white" style={{ background: "#C8873A" }}>공지</span>
          <p className="text-[13px] text-stone-700 truncate">지브릭커피 앱 오픈 이벤트 — 무료 아메리카노 쿠폰 증정</p>
          <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </section>

    </main>
  );
}

function NearStoreCard({ store }: { store: Store & { dist?: number | null } }) {
  const hours = store.operatingHours?.[TODAY];
  const isOpen = store.status === "ACTIVE";
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      {/* 썸네일 */}
      <div className="h-32 relative flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #1A0E05, #3D2210)" }}>
        <span className="text-6xl font-black tracking-widest select-none" style={{ color: "rgba(255,255,255,0.1)" }}>G</span>
        {store.dist != null && (
          <span className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: "#C8873A" }}>
            {formatDistance(store.dist)}
          </span>
        )}
        <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full text-white ${isOpen ? "bg-green-500" : "bg-stone-400"}`}>
          {isOpen ? "영업중" : "영업종료"}
        </span>
      </div>
      {/* 정보 */}
      <div className="px-4 py-3">
        <p className="font-bold text-[15px]" style={{ color: "#1A0E05" }}>{store.name}</p>
        <p className="text-xs text-stone-500 mt-0.5">{store.address}</p>
        {hours && <p className="text-xs text-stone-400 mt-0.5">오늘 {hours.open} ~ {hours.close}</p>}
        <Link href={`/gbrick/stores/${store.id}/menu`}
          className="flex items-center justify-center w-full mt-3 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "#1A0E05" }}>
          테이크 아웃
        </Link>
      </div>
    </div>
  );
}
