import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { getSuccessCases } from "@/lib/franchise/successCases";

/**
 * 가맹 성공사례 — 데이터는 lib/franchise/successCases.ts(추후 09_성공사례DB 연동 예정).
 * 검증된 실제 매장 사실과 실사진만 사용하며, 가상 후기·미검증 수치는 표시하지 않는다.
 */
export function SuccessCases() {
  const cases = getSuccessCases();

  return (
    <section id="cases" className="bg-muted/40 py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Cases"
          title="실제 매장 사례"
          description="직영 1호점에서 검증한 모델을 기준으로 가맹점을 확장해왔습니다."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {cases.map((item) => (
            <article
              key={item.code}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={item.image}
                  alt={`${item.title} — ${item.location}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  {item.category}
                </span>
                <h3 className="text-base font-semibold leading-snug text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.location}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
