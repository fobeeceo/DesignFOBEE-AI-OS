"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Notice {
  id: string;
  title: string;
  content: string;
  isImportant: boolean;
  createdAt: string;
}

const STORE_ID = process.env.NEXT_PUBLIC_GBRICK_STORE_ID || "store_gbrick_sinchon";

export default function StoreNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function fetchNotices() {
    setLoading(true);
    try {
      const res = await fetch(`/api/gbrick/store/notices?storeId=${STORE_ID}`);
      const data = await res.json();
      setNotices(data.notices ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNotices(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/gbrick/store/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: STORE_ID, title, content, isImportant }),
      });
      if (res.ok) {
        setTitle(""); setContent(""); setIsImportant(false); setShowForm(false);
        await fetchNotices();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-col min-h-screen pb-20" style={{ background: "#f8f7f5", fontFamily: "Pretendard, sans-serif" }}>
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 text-white shadow-sm" style={{ background: "#2C1A0E" }}>
        <div className="flex items-center gap-3">
          <Link href="/store/orders" className="text-amber-200 text-lg font-bold">←</Link>
          <span className="font-bold">매장 공지</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: "#C8873A", color: "#fff" }}
        >
          {showForm ? "닫기" : "공지 작성"}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border-b border-stone-100 px-4 py-4 flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="공지 제목"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="공지 내용"
            required
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm resize-none focus:outline-none focus:border-amber-400"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="important"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
            <label htmlFor="important" className="text-sm text-stone-600">중요 공지</label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: "#2C1A0E" }}
          >
            {submitting ? "등록 중..." : "공지 등록"}
          </button>
        </form>
      )}

      <div className="px-4 pt-3 flex flex-col gap-3">
        {loading ? (
          <div className="text-center text-sm text-stone-400 py-10">불러오는 중...</div>
        ) : notices.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <div className="text-4xl mb-2">📢</div>
            <p className="text-sm">등록된 공지가 없습니다</p>
          </div>
        ) : (
          notices.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-xl border shadow-sm px-4 py-3"
              style={{ borderColor: n.isImportant ? "#FCD34D" : "#e5e7eb" }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className={`text-sm font-semibold ${n.isImportant ? "text-amber-700" : "text-stone-800"}`}>
                  {n.isImportant && "📌 "}{n.title}
                </span>
                <span className="text-xs text-stone-400 whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                </span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed whitespace-pre-wrap">{n.content}</p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
