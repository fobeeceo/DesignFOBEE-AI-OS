"use client";

import { useEffect, useState } from "react";

export default function AiBriefingPage() {
  const [briefing, setBriefing] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    fetch("/api/gbrick/hq/ai/briefing")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setBriefing(d.briefing ?? "");
        setGeneratedAt(d.generatedAt ?? "");
        setSource(d.source ?? "");
      })
      .catch(() => setError("AI 브리핑을 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>AI 브리핑</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Gemini AI가 분석한 오늘의 경영 현황</p>
        </div>
        <button onClick={load} disabled={loading} style={{ background: "#2C1A0E", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13, opacity: loading ? 0.6 : 1 }}>
          {loading ? "생성 중..." : "새로 생성"}
        </button>
      </div>

      {/* Briefing Card */}
      <div style={{ background: "linear-gradient(135deg, #2C1A0E 0%, #3D2614 100%)", borderRadius: 16, padding: 32, color: "#fff", marginBottom: 24, minHeight: 240, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 20, right: 24, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          {source === "gemini" ? "✨ Gemini AI" : source === "mock" ? "🔧 Mock 데이터" : ""}
        </div>
        <div style={{ fontSize: 12, color: "#C8873A", fontWeight: 600, marginBottom: 16, letterSpacing: 1 }}>📋 CEO DAILY BRIEFING</div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
            <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#C8873A", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            AI가 경영 현황을 분석하고 있습니다...
          </div>
        ) : error ? (
          <div style={{ color: "#F87171", fontSize: 14 }}>{error}</div>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.9)", whiteSpace: "pre-wrap" }}>
            {briefing}
          </div>
        )}

        {generatedAt && !loading && (
          <div style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            생성 시각: {new Date(generatedAt).toLocaleString("ko-KR")}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { icon: "🤖", title: "AI 모델", value: "Gemini 1.5 Flash", desc: "Google AI 최신 모델" },
          { icon: "📊", title: "분석 대상", value: "전체 4개 매장", desc: "오늘 실시간 데이터 기반" },
          { icon: "⏰", title: "업데이트", value: "수동 갱신", desc: "버튼으로 최신 브리핑 생성" },
        ].map((item) => (
          <div key={item.title} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#2C1A0E", marginBottom: 2 }}>{item.value}</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
