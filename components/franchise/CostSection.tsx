import { SectionHeading } from "@/components/ui/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { FRANCHISE_COST } from "@/lib/franchise/content";
import { LEGAL_NOTICE } from "@/lib/franchise/publicFacts";

/**
 * 창업 비용 — FAQ 안에 접혀 있던 금액을 표로 꺼내 보인다(2026-10-14 대표 결정).
 * 예비 창업자가 가장 먼저 확인하는 정보라 펼치지 않아도 보여야 한다.
 *
 * ⚠️ 금액·단서는 FRANCHISE_COST만 쓴다. 이 컴포넌트에 숫자를 직접 적지 않는다.
 * ⚠️ 할인·프로모션·예상 수익은 넣지 않는다. 정해진 것이 없고 근거 자료도 없다.
 */
export function CostSection() {
  return (
    <section id="cost" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Cost"
          title="창업 비용"
          description="정보공개서에 적힌 금액을 그대로 공개합니다."
        />

        <div className="mt-12 rounded-2xl border border-border bg-background p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">{FRANCHISE_COST.basis} 총액</p>
          <p className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">{FRANCHISE_COST.total}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{FRANCHISE_COST.summary}</p>

          <dl className="mt-8 divide-y divide-border border-y border-border">
            {FRANCHISE_COST.items.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <dt className="text-[15px] font-semibold text-foreground">{item.label}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{item.desc}</dd>
                </div>
                <dd className="shrink-0 text-[15px] font-semibold text-foreground">{item.amount}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 flex flex-col gap-1.5">
            {FRANCHISE_COST.notes.map((line) => (
              <li key={line} className="flex gap-1.5 text-sm leading-relaxed text-muted-foreground">
                <span aria-hidden>※</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{LEGAL_NOTICE}</p>

        <div className="mt-10 flex justify-center">
          <a href="#consult" className={buttonVariants({ size: "lg" })}>
            내 조건으로 비용 상담받기
          </a>
        </div>
      </div>
    </section>
  );
}
