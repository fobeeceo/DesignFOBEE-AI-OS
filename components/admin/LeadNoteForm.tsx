"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface LeadNoteFormProps {
  leadId: string;
}

/**
 * STEP 10: 상담 메모 추가 폼. POST /api/admin/leads/[leadId]/notes 호출 후 화면을 새로고침한다.
 * (CRM 데이터 축적이 이 폼을 통해 실제로 쌓인다)
 */
export function LeadNoteForm({ leadId }: LeadNoteFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError("메모 내용을 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "메모 추가에 실패했습니다.");
      }

      setContent("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="통화 내용, 상담 진행 상황 등을 기록하세요."
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button type="submit" size="sm" disabled={loading} className="self-end">
        {loading ? "저장 중..." : "메모 추가"}
      </Button>
    </form>
  );
}
