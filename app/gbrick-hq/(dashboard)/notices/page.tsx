"use client";

import { useEffect, useState } from "react";

type Notice = { id: string; storeId: string | null; title: string; content: string; isGlobal: boolean; createdAt: string };

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/gbrick/hq/notices")
      .then((r) => r.json())
      .then((d) => setNotices(d.notices ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    await fetch("/api/gbrick/hq/notices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, isGlobal: true }) });
    setTitle(""); setContent(""); setShowForm(false);
    load();
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A0E", margin: 0 }}>공지사항</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>전 매장 공지 관리</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: "#C8873A", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
          + 공지 작성
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "#2C1A0E" }}>새 공지 작성</h3>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" style={{ width: "100%", border: "1px solid #e0d9d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 10, boxSizing: "border-box" }} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용" rows={4} style={{ width: "100%", border: "1px solid #e0d9d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12, boxSizing: "border-box", resize: "vertical" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={submit} disabled={saving} style={{ background: "#2C1A0E", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
              {saving ? "저장 중..." : "게시"}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: "#f0ebe4", color: "#666", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>취소</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#999" }}>로딩 중...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notices.map((n) => (
            <div key={n.id} style={{ background: "#fff", borderRadius: 12, padding: "18px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderLeft: `3px solid ${n.isGlobal ? "#C8873A" : "#3B82F6"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, background: n.isGlobal ? "#C8873A22" : "#3B82F622", color: n.isGlobal ? "#C8873A" : "#3B82F6", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                  {n.isGlobal ? "전체 공지" : "매장 공지"}
                </span>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#2C1A0E" }}>{n.title}</div>
              </div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 8 }}>{n.content}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{new Date(n.createdAt).toLocaleDateString("ko-KR")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
