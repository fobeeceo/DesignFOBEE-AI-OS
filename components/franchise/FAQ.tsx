import { SectionHeading } from "@/components/ui/section-heading";
import { FRANCHISE_FAQ } from "@/lib/franchise/content";

/**
 * 자주 묻는 질문 — 상담 전 이탈 요인(저가 브랜드 오해·인테리어 업체 문의·점포 미보유 등)을
 * 미리 해소한다. 창업 비용은 현장 조건에 따라 달라지므로 구체 금액을 단정하지 않는다.
 */
export function FAQ() {
  return (
    <section id="faq" className="bg-muted/40 py-20 sm:py-28">
      <div className="container-px mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="자주 묻는 질문" />

        <div className="mt-12 flex flex-col gap-4">
          {FRANCHISE_FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border bg-background p-6"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-foreground marker:content-none">
                <span className="flex items-start justify-between gap-4">
                  {item.q}
                  <span className="shrink-0 text-accent transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
