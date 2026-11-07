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
        <div style={{
          width: 60, height: 60, borderRadius: "50%", background: "#1A0E05",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(26,14,5,0.35)"
        }}>
          <span style={{ color: "#C8873A", fontSize: 26, fontWeight: 900, fontFamily: "Georgia, serif" }}>G</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#1A0E05", letterSpacing: "0.1em" }}>GBRICK</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(26,14,5,0.55)", letterSpacing: "0.22em", marginTop: 2 }}>COFFEE</p>
        </div>
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
          <button style={{
            width: "100%", padding: "13px", borderRadius: 50,
            fontSize: 15, fontWeight: 600,
            background: "#1A0E05", color: "white",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            <svg width="17" height="17" viewBox="0 0 814 1000" fill="white">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-120.2c-43.3-74.1-82.4-187.9-82.4-296.1 0-159.9 104.1-245 206.4-245 54.6 0 100 37.5 134.2 37.5 32.8 0 84.4-39.5 146.6-39.5zM517.7 95.5c29.1-35 50.6-83.8 50.6-132.6 0-6.5-.6-13-1.9-18.2-47.9 1.9-104.1 31.9-137.9 71.9-26 29.5-48.1 76.9-48.1 126.5 0 7.1 1.3 14.2 1.9 16.5 2.6.6 6.5 1.3 10.4 1.3 43.3 0 95.9-28.5 124.9-65.4z"/>
            </svg>
            애플로 로그인
          </button>
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
