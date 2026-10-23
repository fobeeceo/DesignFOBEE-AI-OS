import type { MeasurementMentioned } from '@/lib/ai-search/types';

interface Props {
  value: MeasurementMentioned;
}

/** 측정 상태 배지 — null(미측정) / true(언급됨) / false(미언급) 3상태를 시각적으로 구분한다. */
export function MentionBadge({ value }: Props) {
  if (value === null) {
    return (
      <span className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground">
        미측정
      </span>
    );
  }
  if (value === true) {
    return (
      <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600">
        ✓ 언급됨
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      미언급
    </span>
  );
}
