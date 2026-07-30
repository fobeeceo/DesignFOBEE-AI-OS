import { SectionHeading } from "@/components/ui/section-heading";
import { FRANCHISE_ADVANTAGES } from "@/lib/franchise/content";

/** 왜 GBRICK인가 — 본사가 직접 제공하는 6개 영역. */
export function Advantages() {
  return (
    <section id="advantages" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Why GBRICK"
          title="왜 GBRICK인가?"
          description="공간 설계부터 오픈 이후 운영까지, 본사가 직접 책임지는 영역입니다."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FRANCHISE_ADVANTAGES.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-background p-6 transition-colors hover:border-accent"
            >
              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
