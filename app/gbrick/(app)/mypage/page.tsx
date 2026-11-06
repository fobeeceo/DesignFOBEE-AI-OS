"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  nickname?: string;
  email?: string;
  pointAccount?: { balance: number; totalEarned: number };
  stampAccounts?: { storeId: string; balance: number }[];
}

export default function MypagePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gbrick/customers")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setCustomer(d?.customer ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/gbrick");
  }

  return (
    <main className="flex flex-col min-h-screen pb-20">
      <header className="flex items-center px-5 py-4 text-white" style={{ background: "#2C1A0E" }}>
        <span className="font-bold">마이 페이지</span>
      </header>

      <div className="px-4 pt-5 flex flex-col gap-4">
        {loading ? (
          <p className="text-sm text-stone-400 text-center py-10">불러오는 중...</p>
        ) : !customer ? (
          /* 비로그인 */
          <div className="flex flex-col items-center gap-4 py-10">
            <span className="text-5xl">👤</span>
            <p className="text-sm text-stone-500">로그인하고 멤버십 혜택을 받아보세요</p>
            <Link
              href="/gbrick/(auth)/login"
              className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
              style={{ background: "#C8873A" }}
            >
              로그인
            </Link>
          </div>
        ) : (
          <>
            {/* Profile card */}
            <div
              className="rounded-2xl px-5 py-4 text-white"
              style={{ background: "linear-gradient(135deg, #2C1A0E, #4A2F14)" }}
            >
              <p className="text-xs text-amber-300 mb-1">회원</p>
              <p className="text-lg font-bold">{customer.nickname ?? "지브릭 고객"}</p>
              <p className="text-xs text-amber-200 mt-0.5">{customer.email}</p>
            </div>

            {/* Points */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4">
              <p className="text-xs font-semibold text-stone-500 mb-3">포인트</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black" style={{ color: "#C8873A" }}>
                  {(customer.pointAccount?.balance ?? 0).toLocaleString()}
                </span>
                <span className="text-sm text-stone-500 mb-1">P</span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                누적 적립 {(customer.pointAccount?.totalEarned ?? 0).toLocaleString()}P
              </p>
            </div>

            {/* Stamps */}
            {(customer.stampAccounts?.length ?? 0) > 0 && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4">
                <p className="text-xs font-semibold text-stone-500 mb-3">스탬프</p>
                {customer.stampAccounts?.map((sa) => (
                  <div key={sa.storeId}>
                    <div className="flex gap-1.5 flex-wrap">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                          style={{
                            background: i < sa.balance ? "#C8873A" : "#F5F0EB",
                            color: i < sa.balance ? "#fff" : "#D6BCB0",
                          }}
                        >
                          ☕
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-stone-400 mt-2">{sa.balance} / 10개</p>
                  </div>
                ))}
              </div>
            )}

            {/* Menu */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              {[
                { label: "주문 내역", href: "/gbrick/(app)/history", icon: "📋" },
                { label: "쿠폰함", href: "/gbrick/(app)/mypage", icon: "🎟️" },
              ].map((item, i) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? "border-t border-stone-100" : ""}`}
                >
                  <span>{item.icon}</span>
                  <span className="flex-1 text-sm font-medium text-stone-700">{item.label}</span>
                  <span className="text-stone-300">→</span>
                </Link>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl text-sm text-stone-500 border border-stone-200"
            >
              로그아웃
            </button>
          </>
        )}
      </div>
    </main>
  );
}
