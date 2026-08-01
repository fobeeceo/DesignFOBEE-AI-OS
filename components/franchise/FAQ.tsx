import { SectionHeading } from "@/components/ui/section-heading";
import { FRANCHISE_FAQ } from "@/lib/franchise/content";

/**
 * 자주 묻는 질문 — 상담 전 이탈 요인(로열티·창업 비용·계약기간 등)을 미리 해소한다.
 *
 * 창업 비용은 2026-08-01 대표 지시로 20평 기준 금액을 공개한다. 다만 현장 조건에 따라
 * 실제 견적이 이를 넘을 수 있다는 단서를 반드시 함께 보여준다(content.ts 주석 참고).
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
              {/* 본문 15px — 예비 창업자 상당수가 40~60대다(코딩 규칙). */}
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{item.a}</p>

              {item.bullets && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {item.bullets.map((line) => (
                    <li
                      key={line}
                      className="flex gap-2 text-[15px] leading-relaxed text-muted-foreground"
                    >
                      <span aria-hidden className="text-accent">·</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}

              {item.notes && (
                <ul className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4">
                  {item.notes.map((line) => (
                    <li key={line} className="flex gap-1.5 text-sm leading-relaxed text-muted-foreground">
                      <span aria-hidden>※</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
