"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadStatus } from "@/types/lead";

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "NEW", label: "신규" },
  { value: "CONTACTED", label: "연락함" },
  { value: "CONVERTED", label: "계약전환" },
  { value: "CLOSED", label: "종료" },
];

interface LeadStatusControlProps {
  leadId: string;
  currentStatus: LeadStatus;
}

/**
 * STEP 10: 리드 상태 변경 드롭다운. PATCH /api/admin/leads/[leadId] 호출 후 화면을 새로고침한다.
 */
export function LeadStatusControl({ leadId, currentStatus }: LeadStatusControlProps) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: LeadStatus) {
    setStatus(next);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "상태 변경에 실패했습니다.");
      }

      router.refresh();
    } catch (err) {
      setStatus(currentStatus);
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={status}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value as LeadStatus)}
        className="h-10 rounded-md border border-border bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {loading && <span className="text-xs text-muted-foreground">저장 중...</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
