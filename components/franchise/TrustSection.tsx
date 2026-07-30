import { STATS } from "@/lib/company/profile";

/**
 * 가맹상담 신뢰지표 — lib/company/profile.ts의 STATS를 그대로 재사용한다(SSOT).
 * 매장 수·가맹점 수·폐점 수 등 시간에 따라 변하는 수치는 CEO 업무지시로 사용하지 않는다.
 */
export function TrustSection() {
  return (
    <section className="border-y border-border bg-muted/40 py-12 sm:py-16">
      <div className="container-px mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-bold text-accent sm:text-2xl">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
