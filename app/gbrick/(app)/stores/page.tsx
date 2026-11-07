"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { haversineKm, formatDistance } from "@/lib/gbrick/utils/distance";

interface Store {
  id: string;
  code: string;
  name: string;
  address: string;
  phone?: string;
  status: string;
  lat?: number;
  lng?: number;
  operatingHours?: Record<string, { open: string; close: string }>;
}

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();

export default function StoreListPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetch("/api/gbrick/stores")
      .then((r) => r.json())
      .then((d) => setStores(d.stores ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
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

  return (
    <main className="flex flex-col min-h-screen pb-24" style={{ background: "#FAF8F5" }}>
      {/* Header */}
      <header
        className="flex items-center px-5 py-4 bg-white border-b border-stone-100"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <Link href="/gbrick" className="mr-3 p-1" aria-label="뒤로">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <span className="font-bold text-base" style={{ color: "#2C1A0E" }}>매장 선택</span>
        {userPos && (
          <span className="ml-auto text-xs text-stone-400 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            </svg>
            가까운 순
          </span>
        )}
      </header>

      {/* GPS notice */}
      {userPos && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl flex items-center gap-2" style={{ background: "#EFF9F0" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
          <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>현재 위치 기준으로 가까운 매장부터 보여드려요</span>
        </div>
      )}

      {/* Store list */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin"/>
            <p className="text-sm text-stone-400 mt-3">매장 정보를 불러오는 중...</p>
          </div>
        ) : storesWithDist.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🏪</div>
            <p className="text-sm text-stone-500 font-semibold">등록된 매장이 없습니다</p>
            <p className="text-xs text-stone-400 mt-1">잠시 후 다시 시도해주세요</p>
          </div>
        ) : (
          storesWithDist.map((store) => {
            const hours = store.operatingHours?.[TODAY];
            const isOpen = store.status === "ACTIVE";
            return (
              <div key={store.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                {/* Store image placeholder */}
                <div
                  className="h-24 flex items-center justify-center relative"
                  style={{ background: "linear-gradient(135deg, #2C1A0E, #4A2F14)" }}
                >
                  <span className="text-4xl font-black tracking-widest text-white opacity-20 select-none">G</span>
                  {store.dist != null && (
                    <span
                      className="absolute top-2.5 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: "#C8873A", color: "#fff" }}
                    >
                      {formatDistance(store.dist)}
                    </span>
                  )}
                </div>

                <div className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-800">{store.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${isOpen ? "bg-green-500" : "bg-stone-400"}`}
                        >
                          {isOpen ? "영업중" : "준비중"}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{store.address}</p>
                      {hours && (
                        <p className="text-xs text-stone-400 mt-0.5">
                          오늘 {hours.open} ~ {hours.close}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/gbrick/stores/${store.id}/menu`}
                    className="flex items-center justify-center w-full mt-3 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: isOpen ? "#2C1A0E" : "#9CA3AF", pointerEvents: isOpen ? "auto" : "none" }}
                  >
                    {isOpen ? "테이크 아웃" : "영업 준비중"}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
