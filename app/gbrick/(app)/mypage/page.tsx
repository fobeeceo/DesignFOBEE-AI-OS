"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MEMBER_POINT_RATE } from "@/lib/gbrick/launch";

interface Member { id: string; nickname: string | null; provider: string; }
interface Points { balance: number; totalEarned: number; totalUsed: number; }
interface Ledger { id: string; type: string; amount: number; balanceAfter: number; createdAt: string; note?: string | null; }

const PROVIDER_LABEL: Record<string, string> = { kakao: "카카오", naver: "네이버" };

export default function MyPage() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [points, setPoints] = useState<Points | null>(null);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);

  useEffect(() => {
    fetch("/api/gbrick/me")
      .then(async r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setMember(d.member ?? null); setPoints(d.points ?? null); setLedgers(d.ledgers ?? []); })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/gbrick/auth/logout", { method: "POST" });
    window.location.href = "/gbrick";
  }

  async function deleteAccount() {
    if (!confirm("정말 회원탈퇴를 하시겠어요?\n닉네임이 지워지고 보유 포인트를 더 이상 쓸 수 없어요. 탈퇴 후에는 되돌릴 수 없어요.")) return;
    try {
      const res = await fetch("/api/gbrick/auth/delete-account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "탈퇴에 실패했어요");
      alert("탈퇴가 완료되었어요.");
      window.location.href = "/gbrick";
    } catch (err) {
      alert(err instanceof Error ? err.message : "탈퇴 처리 중 오류가 발생했어요");
    }
  }

  const header = (
    <header className="px-5 py-4 text-white flex items-center justify-between" style={{ background: "#2C1A0E" }}>
      <span className="font-bold">마이페이지</span>
      {member && <button onClick={logout} className="text-sm text-amber-200">로그아웃</button>}
    </header>
  );

  if (loading) return <main className="flex flex-col min-h-screen pb-20">{header}<p className="text-stone-400 text-center py-16">불러오는 중...</p></main>;

  if (failed) {
    return (
      <main className="flex flex-col min-h-screen pb-20">{header}
        <p className="text-stone-600 text-center py-16 px-6">정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      </main>
    );
  }

  if (!member) {
    return (
      <main className="flex flex-col min-h-screen pb-20">{header}
        <div className="flex flex-col items-center justify-center flex-1 gap-5 px-6">
          <div className="text-5xl">☕</div>
          <p className="text-stone-700 font-semibold text-center">로그인하면 내 주문 내역을 앱에서 볼 수 있어요</p>
          <Link href="/gbrick/login" className="w-full py-3.5 rounded-2xl text-white font-bold text-center" style={{ background: "#C8873A" }}>로그인</Link>
          <p className="text-sm text-stone-500 text-center">로그인 없이도 주문할 수 있어요</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen pb-20">
      {header}
      <div className="px-5 py-4 bg-white border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-xl">☕</div>
          <div>
            <p className="font-bold text-stone-800">{member.nickname ?? "GBRICK 회원"}님</p>
            <p className="text-sm text-stone-500">{PROVIDER_LABEL[member.provider] ?? ""} 계정으로 로그인 중</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-3 flex flex-col gap-2">
        <Link href="/gbrick/history" className="flex items-center justify-between bg-white rounded-xl border border-stone-100 px-4 py-3 shadow-sm">
          <span className="text-base font-semibold text-stone-700">📋 주문 내역</span>
          <span className="text-stone-400">›</span>
        </Link>

        {/* 포인트는 적립률이 정해져 켜질 때까지 보이지 않는다 (테스트 기간 중 적립 없음 — 대표 결정 2026-11-18) */}
        {MEMBER_POINT_RATE > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <p className="text-sm text-stone-500">보유 포인트</p>
            <p className="text-2xl font-black" style={{ color: "#C8873A" }}>{(points?.balance ?? 0).toLocaleString()}P</p>
            <p className="text-sm text-stone-500 mt-2">
              픽업한 주문 금액에 따라 자동으로 적립돼요.
            </p>
            {ledgers.length > 0 && (
              <ul className="mt-3 divide-y divide-stone-100">
                {ledgers.map(l => (
                  <li key={l.id} className="flex justify-between py-2 text-sm">
                    <span className="text-stone-600">{new Date(l.createdAt).toLocaleDateString("ko-KR")} {l.amount > 0 ? "적립" : "사용"}</span>
                    <span className={l.amount > 0 ? "font-semibold text-amber-700" : "font-semibold text-stone-600"}>{l.amount > 0 ? "+" : ""}{l.amount.toLocaleString()}P</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="px-5 mt-6 pb-8 flex flex-col gap-2">
        <button onClick={logout} className="w-full py-3 rounded-xl text-sm font-semibold text-stone-600 border border-stone-200 bg-white">로그아웃</button>
        <button onClick={deleteAccount} className="w-full py-2.5 rounded-xl text-sm font-medium text-stone-400">회원탈퇴</button>
      </div>
    </main>
  );
}
