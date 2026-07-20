import type { LeadStatus } from "@/types/lead";

const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "신규",
  CONTACTED: "연락함",
  CONVERTED: "계약전환",
  CLOSED: "종료",
};

const STATUS_CLASS: Record<LeadStatus, string> = {
  NEW: "bg-accent/10 text-accent",
  CONTACTED: "bg-primary/10 text-primary",
  CONVERTED: "bg-emerald-500/10 text-emerald-600",
  CLOSED: "bg-muted text-muted-foreground",
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

/**
 * STEP 10: 리드 상태를 색상 뱃지로 표시한다. (목록/상세 화면 공용)
 */
export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
