import { SectionHeading } from "@/components/ui/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { FRANCHISE_PROCESS } from "@/lib/franchise/content";

/** 창업 절차 8단계 — 상담 신청부터 사후관리까지의 흐름을 선형으로 보여준다. */
export function Process() {
  return (
    <section id="process" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Process"
          title="창업 절차"
          description="상담 신청부터 오픈 이후 관리까지, 8단계로 진행됩니다."
        />

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FRANCHISE_PROCESS.map((item) => (
            <li
              key={item.step}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-6"
            >
              <span className="text-xs font-bold tracking-widest text-accent">STEP {item.step}</span>
              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center">
          <a href="#consult" className={buttonVariants({ size: "lg" })}>
            창업 가능성 진단받기
          </a>
        </div>
      </div>
    </section>
  );
}
