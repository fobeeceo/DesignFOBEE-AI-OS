"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Store { id: string; name: string; address?: string | null; status?: string | null; }

export default function AdminIndexPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/gbrick/stores", { cache: "no-store" })
      .then(r => r.json())
      .then((d: { stores?: Store[]; error?: string }) => {
        if (d.error) { setError(d.error); return; }
        setStores(d.stores ?? []);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F9F7F5" }}>
      {/* Header */}
      <header style={{ background: "#2C1A0E" }} className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-amber-300 font-black text-lg tracking-tight">GBRICK</span>
          <span className="text-xs text-amber-200 bg-amber-900 px-2 py-0.5 rounded-full font-semibold">사장님 앱</span>
        </div>
        <p className="text-white text-xl font-bold">매장 선택</p>
        <p className="text-amber-300 text-xs mt-0.5">관리할 매장을 선택하세요</p>
      </header>

      <div className="flex-1 px-4 pt-5">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-stone-400">매장 목록 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs font-bold text-red-600 mb-1">⚠️ 오류</p>
            <p className="text-xs text-red-500 break-all">{error}</p>
          </div>
        )}

        {!loading && !error && stores.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p className="text-3xl mb-3">🏪</p>
            <p className="text-sm font-semibold">등록된 매장이 없습니다</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {stores.map(store => (
            <button key={store.id} onClick={() => router.push(`/gbrick/admin/${store.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 text-left active:scale-95 transition-transform flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F5F0EB" }}>
                <span className="text-2xl">☕</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-stone-800">{store.name}</p>
                {store.address && <p className="text-xs text-stone-400 truncate mt-0.5">{store.address}</p>}
                <p className="text-[11px] font-mono text-stone-300 mt-0.5">{store.id}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8873A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
