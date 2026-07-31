"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LeadAiPanelProps {
  leadId: string;
  initialSummary?: string | null;
  initialNextAction?: string | null;
  initialMemo?: string | null;
}

/**
 * STEP 11: 관리자 AI 상담 요약 영역.
 * 상담 요약·다음 액션은 저장 시 AI가 만든 초안이 들어 있고, 관리자가 통화 후 직접 보정한다.
 * PATCH /api/admin/leads/[leadId] (status 없이 전송) → 저장 후 화면 새로고침.
 */
export function LeadAiPanel({
  leadId,
  initialSummary,
  initialNextAction,
  initialMemo,
}: LeadAiPanelProps) {
  const router = useRouter();
  const [aiSummary, setAiSummary] = useState(initialSummary ?? "");
  const [nextAction, setNextAction] = useState(initialNextAction ?? "");
  const [aiMemo, setAiMemo] = useState(initialMemo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiSummary, nextAction, aiMemo }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border p-5">
      <p className="text-xs font-semibold text-accent">AI 상담 요약</p>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">상담 요약</span>
        <textarea
          value={aiSummary}
          onChange={(e) => setAiSummary(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">다음 액션</span>
        <textarea
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">AI 메모</span>
        <textarea
          value={aiMemo}
          onChange={(e) => setAiMemo(e.target.value)}
          rows={3}
          placeholder="상담 중 확인한 내용을 자유롭게 기록하세요."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-9 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        {saved && <span className="text-xs text-muted-foreground">저장되었습니다.</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
