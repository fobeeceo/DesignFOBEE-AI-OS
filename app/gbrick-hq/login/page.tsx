"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function HqLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    const redirect = searchParams.get("redirect") ?? "/gbrick-hq/dashboard";
    router.push(redirect);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f7f5", fontFamily: "Pretendard, -apple-system, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380, padding: 40, background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 10, color: "#C8873A", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>HQ ADMIN</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#2C1A0E" }}>GBRICK Coffee</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>본사 관리자 로그인</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            required
            style={{ border: "1px solid #e0d9d0", borderRadius: 10, padding: "12px 16px", fontSize: 14, outline: "none" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            style={{ border: "1px solid #e0d9d0", borderRadius: 10, padding: "12px 16px", fontSize: 14, outline: "none" }}
          />

          {error && <div style={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{ background: "#2C1A0E", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: "12px 16px", background: "#f8f7f5", borderRadius: 8, fontSize: 11, color: "#aaa", textAlign: "center" }}>
          본사 관리자 계정 문의: ceo@fobee.co.kr
        </div>
      </div>
    </div>
  );
}

export default function HqLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>로딩 중...</div>}>
      <HqLoginForm />
    </Suspense>
  );
}
