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

function getTodayHours(store: Store): string | null {
  const h = store.operatingHours?.[TODAY];
  if (!h) return null;
  return `${h.open} ~ ${h.close}`;
}

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
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { timeout: 5000 }
    );
  }, []);

  const storesWithDist = stores
    .map((s) => ({
      ...s,
      dist: userPos && s.lat && s.lng ? haversineKm(userPos.lat, userPos.lng, s.lat, s.lng) : null,
    }))
    .sort((a, b) => {
      if (a.dist == null && b.dist == null) return 0;
      if (a.dist == null) return 1;
      if (b.dist == null) return -1;
      return a.dist - b.dist;
    });

  const nearestStore = storesWithDist[0] ?? null;

  return (
    <main className="flex flex-col min-h-screen pb-20" style={{ background: "#FAF8F5" }}>
      {/* Top Bar */}
      <header
        className="flex items-center justify-between px-5 pt-4 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <div>
          <div className="text-xl font-black tracking-widest" style={{ color: "#2C1A0E" }}>GBRICK</div>
          <div className="text-[10px] tracking-[0.25em] font-semibold" style={{ color: "#C8873A" }}>COFFEE</div>
        </div>
        <div className="flex items-center gap-4">
          <button aria-label="QR 스캔">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>
            </svg>
          </button>
          <Link href="/gbrick/cart" aria-label="장바구니">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </Link>
          <Link href="/gbrick/notifications" aria-label="알림">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* Member / Guest Banner */}
      <section className="mx-4 mt-2 mb-4 rounded-2xl overflow-hidden">
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: "linear-gradient(135deg, #2C1A0E 0%, #4A2F14 100%)" }}
        >
          <div>
            <p className="text-xs text-amber-200 mb-0.5">회원이 되면 더 많은 혜택을!</p>
            <p className="text-white font-bold text-sm leading-snug">
              10잔 마시면<br />아메리카노 1잔 무료
            </p>
            <Link
              href="/gbrick/login"
              className="inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-bold text-stone-900"
              style={{ background: "#F5E6C8" }}
            >
              로그인 / 회원가입
            </Link>
          </div>
          <div className="flex flex-col items-center gap-1">
            {/* Stamp progress dots */}
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-2"
                  style={{
                    borderColor: "#C8873A",
                    background: i < 3 ? "#C8873A" : "transparent",
                  }}
                />
              ))}
            </div>
            <p className="text-[10px] text-amber-300 mt-1">3 / 10 스탬프</p>
          </div>
        </div>
      </section>

      {/* 근처 매장 */}
      <section className="mx-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: "#2C1A0E" }}>
            {gpsLoading ? "위치 확인 중..." : nearestStore ? "근처 매장을 찾았어요" : "매장 안내"}
          </h2>
          <Link href="/gbrick/stores" className="text-xs font-semibold" style={{ color: "#C8873A" }}>
            전체 보기
          </Link>
        </div>

        {nearestStore ? (
          <NearbyStoreCard store={nearestStore} />
        ) : !gpsLoading && stores.length > 0 ? (
          <NearbyStoreCard store={{ ...stores[0], dist: null }} />
        ) : !gpsLoading ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-stone-100">
            <p className="text-sm text-stone-400">매장 정보를 불러오는 중...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-stone-100">
            <p className="text-sm text-stone-400">위치 정보를 가져오는 중...</p>
          </div>
        )}
      </section>

      {/* Promo Banner */}
      <section className="mx-4 mb-4">
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #FFF8EE, #FDEBD0)" }}
        >
          <div>
            <p className="text-xs font-semibold" style={{ color: "#C8873A" }}>이달의 추천</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: "#2C1A0E" }}>
              지브릭 시그니처 라떼
            </p>
            <p className="text-xs text-stone-500 mt-0.5">스페셜티 원두 · 수제 시럽</p>
          </div>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
            style={{ background: "#2C1A0E" }}
          >
            ☕
          </div>
        </div>
      </section>

      {/* Quick Menu */}
      <section className="mx-4 mb-6">
        <h2 className="text-base font-bold mb-3" style={{ color: "#2C1A0E" }}>빠른 메뉴</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: "☕", label: "주문하기", href: "/gbrick/stores" },
            { icon: "🎁", label: "선물하기", href: "/gbrick/gift" },
            { icon: "🎟️", label: "쿠폰함", href: "/gbrick/coupons" },
            { icon: "👤", label: "내 정보", href: "/gbrick/mypage" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white shadow-sm border border-stone-100"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-semibold text-stone-600">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Notice */}
      <section className="mx-4 mb-4">
        <div className="bg-white rounded-2xl px-4 py-3 border border-stone-100 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#C8873A" }}>공지</span>
            <p className="text-sm text-stone-700 flex-1 truncate">지브릭커피 앱 오픈 이벤트 — 무료 아메리카노 쿠폰 증정</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function NearbyStoreCard({ store }: { store: Store & { dist?: number | null } }) {
  const hours = getTodayHours(store);
  const isOpen = store.status === "ACTIVE";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
      {/* Store header image */}
      <div
        className="h-28 flex items-center justify-center relative"
        style={{ background: "linear-gradient(135deg, #2C1A0E 0%, #3D2210 50%, #5A3520 100%)" }}
      >
        <span className="text-5xl font-black tracking-widest text-white opacity-20 select-none">G</span>
        {store.dist != null && (
          <span
            className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "#C8873A", color: "#fff" }}
          >
            {formatDistance(store.dist)}
          </span>
        )}
        <span
          className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${isOpen ? "bg-green-500" : "bg-stone-400"} text-white`}
        >
          {isOpen ? "영업중" : "영업종료"}
        </span>
      </div>

      {/* Store info */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-stone-800">{store.name}</h3>
            <p className="text-xs text-stone-500 mt-0.5 truncate">{store.address}</p>
            {hours && (
              <p className="text-xs text-stone-400 mt-0.5">오늘 {hours}</p>
            )}
          </div>
        </div>
        <Link
          href={`/gbrick/stores/${store.id}/menu`}
          className="flex items-center justify-center w-full mt-3 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "#2C1A0E" }}
        >
          테이크 아웃
        </Link>
      </div>
    </div>
  );
}
