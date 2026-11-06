"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Customer { id: string; nickname?: string; phone?: string; }
interface PointAccount { balance: number; totalEarned: number; totalUsed: number; }
interface StampAccount { balance: number; storeId: string; }
interface CouponIssue {
  id: string;
  redeemed: boolean;
  expiresAt?: string;
  coupon: { name: string; type: string; discountAmount?: number; discountRate?: number };
}

export default function MyPage() {
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pointAccount, setPointAccount] = useState<PointAccount | null>(null);
  const [coupons, setCoupons] = useState<CouponIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"points" | "stamps" | "coupons">("points");
  const [stampCount, setStampCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadProfile();
      else setLoading(false);
    });
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const [customerRes, pointsRes, couponsRes] = await Promise.all([
        fetch("/api/gbrick/customers"),
        fetch("/api/gbrick/points"),
        fetch("/api/gbrick/coupons"),
      ]);
      const [cd, pd, cod] = await Promise.all([customerRes.json(), pointsRes.json(), couponsRes.json()]);
      setCustomer(cd.customer ?? null);
      setPointAccount(pd.account ?? null);
      setCoupons(cod.coupons ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/gbrick";
  }

  async function handleDeleteAccount() {
    if (!confirm("정말 회원탈퇴를 하시겠습니까?\n탈퇴 후에는 복구할 수 없습니다.")) return;
    try {
      const res = await fetch("/api/gbrick/auth/delete-account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "탈퇴 실패");
      alert("탈퇴가 완료되었습니다.");
      window.location.href = "/gbrick";
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "탈퇴 처리 중 오류가 발생했습니다.");
    }
  }

  async function claimWelcomeCoupon() {
    const res = await fetch("/api/gbrick/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "issue_welcome" }),
    });
    const data = await res.json();
    if (data.issue) {
      setCoupons((prev) => [...prev, data.issue]);
    } else {
      alert(data.error ?? "이미 발급된 쿠폰입니다");
    }
  }

  const STAMP_GOAL = 10;
  const activeCoupons = coupons.filter((c) => !c.redeemed);
  const usedCoupons = coupons.filter((c) => c.redeemed);

  if (!user) {
    return (
      <main className="flex flex-col min-h-screen pb-20">
        <header className="px-5 py-4 text-white flex items-center gap-3" style={{ background: "#2C1A0E" }}>
          <span className="font-bold">마이페이지</span>
        </header>
        <div className="flex flex-col items-center justify-center flex-1 gap-5 px-6">
          <div className="text-5xl">☕</div>
          <p className="text-stone-700 font-semibold text-center">로그인 후 포인트·스탬프·쿠폰을 확인하세요</p>
          <Link
            href="/gbrick/login"
            className="w-full py-3.5 rounded-2xl text-white font-bold text-center"
            style={{ background: "#C8873A" }}
          >
            로그인
          </Link>
          <Link href="/gbrick/signup" className="text-sm text-stone-500">회원가입</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen pb-20">
      <header className="px-5 py-4 text-white flex items-center justify-between" style={{ background: "#2C1A0E" }}>
        <span className="font-bold">마이페이지</span>
        <button onClick={handleLogout} className="text-xs text-amber-200">로그아웃</button>
      </header>

      {/* Profile */}
      <div className="px-5 py-4 bg-white border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-xl">☕</div>
          <div>
            <p className="font-bold text-stone-800">{customer?.nickname ?? "GBRICK 회원"}</p>
            <p className="text-xs text-stone-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 divide-x divide-stone-100 bg-white border-b border-stone-100 mb-3">
        <div className="flex flex-col items-center py-4 gap-0.5">
          <p className="text-xl font-black" style={{ color: "#C8873A" }}>{(pointAccount?.balance ?? 0).toLocaleString()}</p>
          <p className="text-xs text-stone-500">포인트</p>
        </div>
        <div className="flex flex-col items-center py-4 gap-0.5">
          <p className="text-xl font-black" style={{ color: "#2C1A0E" }}>{stampCount}</p>
          <p className="text-xs text-stone-500">스탬프</p>
        </div>
        <div className="flex flex-col items-center py-4 gap-0.5">
          <p className="text-xl font-black text-green-600">{activeCoupons.length}</p>
          <p className="text-xs text-stone-500">쿠폰</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 bg-white mb-3">
        {(["points", "stamps", "coupons"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-semibold transition-colors"
            style={{
              color: tab === t ? "#C8873A" : "#9CA3AF",
              borderBottom: tab === t ? "2px solid #C8873A" : "2px solid transparent",
            }}
          >
            {t === "points" ? "포인트" : t === "stamps" ? "스탬프" : "쿠폰"}
          </button>
        ))}
      </div>

      {/* Menu links */}
      <div className="px-5 mb-3 flex flex-col gap-2">
        <Link href="/gbrick/history" className="flex items-center justify-between bg-white rounded-xl border border-stone-100 px-4 py-3 shadow-sm">
          <span className="text-sm font-semibold text-stone-700">📋 주문 내역</span>
          <span className="text-stone-400 text-sm">›</span>
        </Link>
      </div>

      <div className="px-5">
        {tab === "points" && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-xs text-stone-500">보유</p>
                <p className="text-2xl font-black" style={{ color: "#C8873A" }}>
                  {(pointAccount?.balance ?? 0).toLocaleString()}P
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-500">총 적립</p>
                <p className="text-sm font-semibold text-stone-700">
                  {(pointAccount?.totalEarned ?? 0).toLocaleString()}P
                </p>
              </div>
            </div>
            <p className="text-xs text-stone-400">주문 금액의 3% 자동 적립 · 100P 단위 사용 가능</p>
          </div>
        )}

        {tab === "stamps" && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-stone-700 mb-4">
              스탬프 ({stampCount}/{STAMP_GOAL})
            </p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: STAMP_GOAL }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-full flex items-center justify-center text-lg"
                  style={{ background: i < stampCount ? "#C8873A" : "#F5F5F4" }}
                >
                  {i < stampCount ? "☕" : "○"}
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400">{STAMP_GOAL}개 모으면 아메리카노 1잔 무료</p>
          </div>
        )}

        {tab === "coupons" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={claimWelcomeCoupon}
              className="w-full py-3 rounded-2xl border-2 border-dashed text-sm font-semibold"
              style={{ borderColor: "#C8873A", color: "#C8873A" }}
            >
              첫 방문 감사 쿠폰 받기
            </button>
            {activeCoupons.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-6">사용 가능한 쿠폰이 없습니다</p>
            ) : (
              activeCoupons.map((issue) => (
                <div key={issue.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-stone-800">{issue.coupon.name}</p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {issue.coupon.type === "DISCOUNT_AMOUNT"
                          ? `${issue.coupon.discountAmount?.toLocaleString()}원 할인`
                          : `${((issue.coupon.discountRate ?? 0) * 100).toFixed(0)}% 할인`}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold">
                      사용가능
                    </span>
                  </div>
                  {issue.expiresAt && (
                    <p className="text-xs text-stone-400 mt-2">
                      ~{new Date(issue.expiresAt).toLocaleDateString("ko-KR")} 까지
                    </p>
                  )}
                </div>
              ))
            )}
            {usedCoupons.length > 0 && (
              <p className="text-xs text-stone-400 text-center mt-2">사용됨 {usedCoupons.length}개</p>
            )}
          </div>
        )}
      </div>

      {/* Account actions */}
      <div className="px-5 mt-6 pb-8 flex flex-col gap-2">
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl text-sm font-semibold text-stone-600 border border-stone-200 bg-white"
        >
          로그아웃
        </button>
        <button
          onClick={handleDeleteAccount}
          className="w-full py-2.5 rounded-xl text-xs font-medium text-stone-400"
        >
          회원탈퇴
        </button>
      </div>
    </main>
  );
}
