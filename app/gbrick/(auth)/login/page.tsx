"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const ERROR_TEXT: Record<string, string> = {
  cancelled: "로그인을 취소했어요. 다시 시도해 주세요.",
  state: "로그인 확인에 실패했어요. 다시 시도해 주세요.",
  not_ready: "이 로그인은 아직 준비 중이에요. 잠시 후 이용해 주세요.",
  profile: "로그인 정보를 확인하지 못했어요. 다시 시도해 주세요.",
  failed: "로그인 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
};

function LoginContent() {
  const params = useSearchParams();
  const next = params.get("next") ?? params.get("redirect") ?? "/gbrick/mypage";
  const error = params.get("error");
  // 아이폰 홈 화면 앱에서는 네이버 로그인이 "등록되지 않은 사이트"로 막힌다 (2026-11-18 실제 기기에서 확인, 카카오는 정상).
  // 원인을 확인하기 전까지는 홈 화면 앱에서 막힌 버튼을 보이지 않고 브라우저에서 이용하도록 안내한다.
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    setStandalone(nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches);
  }, []);
  const href = (provider: "kakao" | "naver") => `/api/gbrick/auth/${provider}?next=${encodeURIComponent(next)}`;

  return (
    <main style={{ minHeight: "100svh", display: "flex", flexDirection: "column", background: "white" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "calc(env(safe-area-inset-top) + 12px) 20px 8px" }}>
        <Link href="/gbrick" aria-label="뒤로" style={{ display: "flex", alignItems: "center", color: "#1A0E05", textDecoration: "none" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#1A0E05" }}>로그인</span>
      </div>

      <div style={{ background: "linear-gradient(to bottom, #C8873A 0%, #E8D3B0 65%, white 100%)", padding: "28px 0 36px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <p style={{ fontSize: 20, fontWeight: 900, color: "#1A0E05", letterSpacing: "0.06em" }}>G.BRICK COFFEE</p>
        <p style={{ fontSize: 15, color: "#5A3E22" }}>간편하게 로그인하고 주문 내역을 확인하세요</p>
      </div>

      <div style={{ flex: 1, padding: "28px 24px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {error && (
          <p role="alert" style={{ fontSize: 15, color: "#B42318", background: "#FEF3F2", borderRadius: 12, padding: "12px 14px", margin: 0 }}>
            {ERROR_TEXT[error] ?? ERROR_TEXT.failed}
          </p>
        )}

        <a href={href("kakao")} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 15, borderRadius: 50, fontSize: 16, fontWeight: 700, background: "#FEE500", color: "#191919", textDecoration: "none" }}>
          카카오로 시작하기
        </a>
        {standalone ? (
          <p style={{ fontSize: 14, color: "#5A3E22", background: "#FFF6E5", borderRadius: 12, padding: "12px 14px", margin: 0, lineHeight: 1.6 }}>
            네이버 로그인은 홈 화면 앱에서 아직 지원되지 않아요. 카카오로 시작하거나, 사파리 등 브라우저에서 이용해 주세요.
          </p>
        ) : (
          <a href={href("naver")} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 15, borderRadius: 50, fontSize: 16, fontWeight: 700, background: "#03C75A", color: "white", textDecoration: "none" }}>
            네이버로 시작하기
          </a>
        )}

        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, margin: "8px 4px 0" }}>
          로그인 없이도 주문할 수 있어요. 로그인하면 내 주문 내역을 앱에서 다시 볼 수 있어요.<br />
          카카오·네이버로는 <b>닉네임(이름)과 회원번호</b>만 받아요.
        </p>
        <Link href="/privacy" style={{ fontSize: 14, color: "#888", margin: "0 4px" }}>개인정보처리방침</Link>
      </div>
    </main>
  );
}

export default function GbrickLoginPage() {
  return <Suspense fallback={null}><LoginContent /></Suspense>;
}
