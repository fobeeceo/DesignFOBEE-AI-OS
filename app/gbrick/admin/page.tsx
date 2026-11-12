"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SESSION_KEY = "gbrick_pos_unlocked";

interface Store { id: string; name: string; address?: string | null; status?: string | null; }

// ── PIN 잠금 화면 ──────────────────────────────────────────────
function PinScreen({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  function handleDigit(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");
    if (value && index < 3) refs[index + 1].current?.focus();
    if (index === 3 && value) {
      const pin = [...next.slice(0, 3), value].join("");
      if (pin.length === 4) checkPin(pin);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  }

  async function checkPin(pin: string) {
    setChecking(true);
    try {
      const res = await fetch("/api/gbrick/admin/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* private mode */ }
        onUnlock();
      } else {
        setError("PIN이 틀렸습니다");
        setDigits(["", "", "", ""]);
        setTimeout(() => refs[0].current?.focus(), 50);
      }
    } catch {
      setError("서버 오류. 다시 시도하세요.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { refs[0].current?.focus(); }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#2C1A0E" }}>
      {/* Logo */}
      <div className="mb-10 text-center">
        <p className="text-amber-300 font-black text-3xl tracking-tight mb-1">GBRICK</p>
        <p className="text-amber-200 text-sm">사장님 앱 · POS</p>
      </div>

      {/* PIN 입력 */}
      <div className="bg-stone-900 rounded-3xl p-8 w-full max-w-xs shadow-2xl">
        <p className="text-white font-bold text-center mb-6 text-base">PIN을 입력하세요</p>
        <div className="flex justify-center gap-4 mb-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={checking}
              className="w-14 h-14 rounded-2xl text-center text-2xl font-black text-white outline-none transition-all"
              style={{
                background: d ? "#C8873A" : "#3D2A1A",
                border: `2px solid ${error ? "#EF4444" : d ? "#C8873A" : "#5C3D24"}`,
                caretColor: "transparent",
              }}
            />
          ))}
        </div>
        {error && (
          <p className="text-red-400 text-xs text-center mt-3 font-semibold">{error}</p>
        )}
        {checking && (
          <div className="flex justify-center mt-4">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <p className="text-stone-600 text-xs mt-8 text-center">
        PIN을 모르는 경우 매장 관리자에게 문의하세요
      </p>
    </div>
  );
}

// ── 매장 선택 화면 ─────────────────────────────────────────────
export default function AdminIndexPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  // 브라우저가 열릴 때 sessionStorage 확인 (브라우저 재시작 시 초기화됨)
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") setUnlocked(true);
    } catch { /* private mode — 항상 PIN 요구 */ }
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    fetch("/api/gbrick/stores", { cache: "no-store" })
      .then(r => r.json())
      .then((d: { stores?: Store[]; error?: string }) => {
        if (d.error) { setError(d.error); return; }
        setStores(d.stores ?? []);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [unlocked]);

  if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />;

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
