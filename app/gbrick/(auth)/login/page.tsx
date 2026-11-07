"use client";

import Link from "next/link";
import { useState } from "react";

export default function GbrickLoginPage() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const filled = id.trim().length > 0 && pw.length > 0;

  return (
    <main style={{ minHeight: "100svh", display: "flex", flexDirection: "column", background: "white" }}>

      {/* 뒤로 가기 헤더 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "calc(env(safe-area-inset-top) + 12px) 20px 8px"
      }}>
        <Link href="/gbrick" style={{ display: "flex", alignItems: "center", color: "#1A0E05", textDecoration: "none" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#1A0E05" }}>로그인</span>
      </div>

      {/* 앰버 그라디언트 로고 영역 */}
      <div style={{
        background: "linear-gradient(to bottom, #C8873A 0%, #E8D3B0 65%, white 100%)",
        padding: "28px 0 36px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10
      }}>
        <div style={{ position: "relative", width: 60, height: 74 }}>
          <svg width="60" height="74" viewBox="0 0 60 76" fill="none">
            <path d="M30 4 C20 16 5 30 5 47 C5 61 16 73 30 73 C44 73 55 61 55 47 C55 30 40 16 30 4Z" fill="#D42B2B"/>
          </svg>
          <span style={{
            position: "absolute", left: "50%", top: "58%",
            transform: "translate(-50%, -50%)",
            color: "white", fontSize: 26, fontWeight: 900, fontFamily: "Georgia, serif",
            lineHeight: 1, userSelect: "none"
          }}>G</span>
        </div>
        <p style={{ fontSize: 20, fontWeight: 900, color: "#1A0E05", letterSpacing: "0.06em", textAlign: "center" }}>G.BRICK COFFEE</p>
      </div>

      {/* 폼 영역 */}
      <div style={{ flex: 1, padding: "28px 24px 0" }}>

        {/* 아이디 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6, display: "block" }}>아이디</label>
          <input
            type="text"
            value={id}
            onChange={e => setId(e.target.value)}
            placeholder="아이디 입력"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "13px 14px", fontSize: 15, color: "#1A0E05",
              border: "1.5px solid #E0D8CF", borderRadius: 12,
              outline: "none", background: "white", fontFamily: "inherit"
            }}
          />
        </div>

        {/* 비밀번호 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6, display: "block" }}>비밀번호</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="비밀번호 입력"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "13px 44px 13px 14px", fontSize: 15, color: "#1A0E05",
                border: "1.5px solid #E0D8CF", borderRadius: 12,
                outline: "none", background: "white", fontFamily: "inherit"
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", padding: 0 }}
            >
              {showPw ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* 로그인 버튼 */}
        <button
          disabled={!filled}
          style={{
            width: "100%", padding: "14px", borderRadius: 50,
            fontSize: 15, fontWeight: 700,
            background: filled ? "#C8873A" : "#E0D8CF",
            color: filled ? "white" : "#AAA",
            border: "none", cursor: filled ? "pointer" : "not-allowed",
            transition: "background 0.2s, color 0.2s"
          }}
        >
          로그인
        </button>

        {/* 링크들 */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 20 }}>
          {["아이디 찾기", "비밀번호 재설정", "회원가입"].map((text, i) => (
            <span key={text} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Link href="#" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>{text}</Link>
              {i < 2 && <span style={{ width: 1, height: 12, background: "#DDD", display: "inline-block" }} />}
            </span>
          ))}
        </div>

        {/* 구분선 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#EEE" }} />
          <span style={{ fontSize: 12, color: "#AAA" }}>또는</span>
          <div style={{ flex: 1, height: 1, background: "#EEE" }} />
        </div>

        {/* 소셜 로그인 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* 네이버 로그인 */}
          <button style={{
            width: "100%", padding: "13px", borderRadius: 50,
            fontSize: 15, fontWeight: 700,
            background: "#03C75A", color: "white",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
            </svg>
            네이버로 로그인
          </button>
          {/* 카카오 로그인 */}
          <button style={{
            width: "100%", padding: "13px", borderRadius: 50,
            fontSize: 15, fontWeight: 700,
            background: "#FEE500", color: "#1A1A1A",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            <svg width="18" height="17" viewBox="0 0 18 17" fill="#1A1A1A">
              <path d="M9 0C4.03 0 0 3.235 0 7.227c0 2.566 1.643 4.826 4.14 6.168L3.157 17l3.724-2.498C7.21 14.63 8.095 14.75 9 14.75c4.971 0 9-3.235 9-7.228C18 3.235 13.971 0 9 0z"/>
            </svg>
            카카오로 로그인
          </button>
        </div>
      </div>

      <div style={{ height: 40 }} />
    </main>
  );
}
