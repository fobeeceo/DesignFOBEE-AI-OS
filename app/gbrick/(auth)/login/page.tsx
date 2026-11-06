"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw authErr;
      const redirect = searchParams.get("redirect") ?? "/gbrick";
      router.push(redirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그인 실패");
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
        <Link href="/gbrick" className="text-amber-200 mr-3 text-lg">←</Link>
        <span className="font-bold tracking-widest">GBRICK COFFEE</span>
      </header>

      <div className="flex-1 px-5 pt-10 pb-24">
        <h1 className="text-2xl font-bold text-stone-800 mb-1">로그인</h1>
        <p className="text-sm text-stone-500 mb-8">멤버십 혜택을 받아보세요</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm mt-2 disabled:opacity-60"
            style={{ background: "#C8873A" }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-stone-500">아직 회원이 아니신가요? </span>
          <Link href="/gbrick/signup" className="text-sm font-semibold" style={{ color: "#C8873A" }}>
            회원가입
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function GbrickLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>로딩 중...</div>}>
      <LoginForm />
    </Suspense>
  );
}
