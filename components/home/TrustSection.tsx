import { STATS } from "@/lib/company/profile";

/**
 * 신뢰 지표 — lib/company/profile.ts의 STATS(지명원·정보공개서 기반 실수치, /about과 동일 SSOT)를
 * 그대로 쓴다. 이전엔 "26+/5/AI" 같은 일반적인 문구였는데, 실제로 이미 확보된 프랜차이즈 실적
 * 수치(7개 매장·3년간 폐점 0건 등)가 있어 그쪽으로 교체(추측 아님 — 기존 /about 데이터 재사용).
 */
export function TrustSection() {
  return (
    <section className="border-y border-border bg-muted/40 py-16">
      <div className="container-px mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-accent sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          중개가 아닙니다 — 설계부터 시공까지, 26년째 저희가 직접 책임집니다.
        </p>
      </div>
    </section>
  );
}
