import { SectionHeading } from "@/components/ui/section-heading";
import { FOUNDED_YEAR, MILESTONES, yearsSince } from "@/lib/company/profile";

/**
 * 디자인포비 회사 소개(연혁). SSOT: 사업자등록증·전문건설업 등록증(2000/2009), 지명원 연혁(2013).
 */
export function AboutSection() {
  return (
    <section id="about" className="bg-muted/40 py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="About Us"
          title={`${yearsSince(FOUNDED_YEAR)}년, 공간을 직접 만들어온 시간`}
          description="주식회사 디자인포비는 2000년 설립된 공간디자인 전문기업입니다. 2009년 실내건축공사업 등록을 마치고 상업공간·오피스·교회 등 다양한 공간을 직접 설계·시공해왔습니다. 예쁜 공간을 만드는 것을 넘어, 그 공간에서 사람들이 더 나은 경험을 하도록 돕는 것이 저희의 일입니다."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MILESTONES.map((m) => (
            <div key={m.year} className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-semibold text-accent">{m.year}</span>
              <p className="mt-2 font-semibold">{m.title}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a href="/about" className="text-sm font-medium text-accent hover:underline">
            회사소개 자세히 보기 →
          </a>
        </div>
      </div>
    </section>
  );
}
