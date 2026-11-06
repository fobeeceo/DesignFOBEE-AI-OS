"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Store {
  id: string;
  code: string;
  name: string;
  address: string;
  phone?: string;
  status: string;
  operatingHours?: Record<string, { open: string; close: string }>;
}

export default function StoreListPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gbrick/stores")
      .then((r) => r.json())
      .then((d) => setStores(d.stores ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "short" }).toLowerCase() as keyof typeof DAY_MAP;
  const DAY_MAP: Record<string, string> = {
    mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토", sun: "일",
  };

  return (
    <main className="flex flex-col min-h-screen pb-20">
      <header
        className="flex items-center px-5 py-4 text-white"
        style={{ background: "#2C1A0E" }}
      >
        <Link href="/gbrick" className="text-amber-200 mr-3 text-lg">←</Link>
        <span className="font-bold">매장 선택</span>
      </header>

      <div className="px-5 pt-6 flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-stone-400 text-center py-10">매장 불러오는 중...</p>
        ) : stores.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-10">등록된 매장이 없습니다</p>
        ) : (
          stores.map((store) => {
            const hours = store.operatingHours?.[today];
            return (
              <Link
                key={store.id}
                href={`/gbrick/(app)/stores/${store.id}/menu`}
                className="block bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
              >
                <div
                  className="h-24 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #2C1A0E, #4A2F14)" }}
                >
                  <span className="text-3xl font-black tracking-widest text-white opacity-30">G</span>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-stone-800">{store.name}</h3>
                      <p className="text-xs text-stone-500 mt-0.5">{store.address}</p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white ml-2 shrink-0"
                      style={{ background: store.status === "ACTIVE" ? "#22c55e" : "#9ca3af" }}
                    >
                      {store.status === "ACTIVE" ? "영업중" : "준비중"}
                    </span>
                  </div>
                  {hours && (
                    <p className="text-xs text-stone-400 mt-1.5">
                      오늘 {DAY_MAP[today] ?? today} · {hours.open} ~ {hours.close}
                    </p>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
