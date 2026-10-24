import type { AnalystMentionStatus } from '@/lib/ai-search/analyst/types';

interface Props {
  status: AnalystMentionStatus;
}

/** 4상태 언급 배지 — MENTIONED / NOT_MENTIONED / FAILED / UNMEASURED */
export function AnalystMentionBadge({ status }: Props) {
  switch (status) {
    case 'MENTIONED':
      return (
        <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600">
          ✓ 언급됨
        </span>
      );
    case 'NOT_MENTIONED':
      return (
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          미언급
        </span>
      );
    case 'FAILED':
      return (
        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
          ⚠ 실패
        </span>
      );
    case 'UNMEASURED':
      return (
        <span className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground">
          미측정
        </span>
      );
  }
}
