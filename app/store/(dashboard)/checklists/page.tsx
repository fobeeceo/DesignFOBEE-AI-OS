"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ChecklistItem { id: string; title: string; isRequired: boolean; sortOrder: number; }
interface Checklist {
  id: string;
  title: string;
  category: string;
  items: ChecklistItem[];
}

const STORE_ID = "store_gbrick_sinchon";

export default function StoreChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [checked, setChecked] = useState<Record<string, Record<string, boolean>>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/gbrick/store/checklists?storeId=${STORE_ID}`)
      .then((r) => r.json())
      .then((d) => {
        setChecklists(d.checklists ?? []);
        const init: Record<string, Record<string, boolean>> = {};
        (d.checklists ?? []).forEach((cl: Checklist) => {
          init[cl.id] = {};
          cl.items.forEach((item) => { init[cl.id][item.id] = false; });
        });
        setChecked(init);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function toggle(clId: string, itemId: string) {
    setChecked((prev) => ({
      ...prev,
      [clId]: { ...prev[clId], [itemId]: !prev[clId]?.[itemId] },
    }));
  }

  async function submit(cl: Checklist) {
    setSubmitting(cl.id);
    try {
      await fetch("/api/gbrick/store/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistId: cl.id,
          completedByName: "담당자",
          itemsChecked: checked[cl.id],
          notes: "",
        }),
      });
      setDone((prev) => new Set([...prev, cl.id]));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(null);
    }
  }

  function isComplete(cl: Checklist) {
    return cl.items.filter((i) => i.isRequired).every((i) => checked[cl.id]?.[i.id]);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/store/orders" className="text-stone-500 text-lg">←</Link>
        <span className="font-black text-lg tracking-widest text-stone-800">GBRICK</span>
        <span className="text-stone-300">|</span>
        <span className="text-sm font-semibold text-stone-600">체크리스트</span>
      </header>

      <main className="px-6 py-5 flex flex-col gap-6">
        {loading ? (
          <p className="text-sm text-stone-400 text-center py-10">불러오는 중...</p>
        ) : checklists.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-10">체크리스트가 없습니다</p>
        ) : (
          checklists.map((cl) => (
            <div key={cl.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-stone-800">{cl.title}</h2>
                {done.has(cl.id) && (
                  <span className="text-xs text-green-600 font-semibold">완료 ✓</span>
                )}
              </div>
              <div className="flex flex-col gap-2 mb-4">
                {cl.items.map((item) => (
                  <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked[cl.id]?.[item.id] ?? false}
                      onChange={() => toggle(cl.id, item.id)}
                      disabled={done.has(cl.id)}
                      className="w-4 h-4 accent-amber-600"
                    />
                    <span className="text-sm text-stone-700">
                      {item.title}
                      {item.isRequired && <span className="text-red-400 ml-1">*</span>}
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => submit(cl)}
                disabled={!isComplete(cl) || done.has(cl.id) || submitting === cl.id}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "#2C1A0E" }}
              >
                {submitting === cl.id ? "저장 중..." : done.has(cl.id) ? "완료됨" : "완료 제출"}
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
