"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function GbrickSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [marketingAgree, setMarketingAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error: authErr } = await supabase.auth.signUp({ email, password });
      if (authErr) throw authErr;
      if (!data.user) throw new Error("회원가입 실패");

      await fetch("/api/gbrick/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, phone, marketingAgree }),
      });

      router.push("/gbrick");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "회원가입 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col min-h-screen">
      <header
        className="flex items-center px-5 py-4 text-white"
        style={{ background: "#2C1A0E" }}
      >
        <button
          onClick={() => step === 2 ? setStep(1) : router.push("/gbrick/(auth)/login")}
          className="text-amber-200 mr-3 text-lg"
        >
          ←
        </button>
        <span className="font-bold tracking-widest">회원가입</span>
        <span className="ml-auto text-xs text-amber-300">{step}/2</span>
      </header>

      <div className="flex-1 px-5 pt-8 pb-24">
        {step === 1 ? (
          <>
            <h1 className="text-xl font-bold text-stone-800 mb-1">계정 만들기</h1>
            <p className="text-sm text-stone-500 mb-8">이메일과 비밀번호를 입력해주세요</p>
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coffee@gbrick.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8자 이상"
                  minLength={8}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm mt-2"
                style={{ background: "#C8873A" }}
              >
                다음
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-stone-800 mb-1">프로필 설정</h1>
            <p className="text-sm text-stone-500 mb-8">멤버십 등록을 위한 정보입니다</p>
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="지브릭 애호가"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">연락처 (선택)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingAgree}
                  onChange={(e) => setMarketingAgree(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-sm text-stone-600">마케팅 정보 수신 동의 (선택)</span>
              </label>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm mt-2 disabled:opacity-60"
                style={{ background: "#C8873A" }}
              >
                {loading ? "가입 중..." : "가입 완료"}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <span className="text-sm text-stone-500">이미 계정이 있으신가요? </span>
          <Link href="/gbrick/(auth)/login" className="text-sm font-semibold" style={{ color: "#C8873A" }}>
            로그인
          </Link>
        </div>
      </div>
    </main>
  );
}
