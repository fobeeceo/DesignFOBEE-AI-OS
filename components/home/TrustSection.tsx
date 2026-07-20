const STATS = [
  { value: "26+", label: "년 공간디자인 경험" },
  { value: "5", label: "개 전문 분야" },
  { value: "AI", label: "24시간 상담 시스템" },
];

/**
 * 신뢰 지표. 실제 누적 프로젝트/고객 수치는 데이터 확보 후 갱신.
 */
export function TrustSection() {
  return (
    <section className="border-y border-border bg-muted/40 py-16">
      <div className="container-px mx-auto grid max-w-6xl grid-cols-3 gap-6 text-center">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="text-3xl font-bold text-accent sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
