import { SectionHeading } from "@/components/ui/section-heading";

const PROJECTS = [
  { name: "상업공간 프로젝트", category: "Commercial" },
  { name: "교회 공간 프로젝트", category: "Church" },
  { name: "오피스 프로젝트", category: "Office" },
];

/**
 * 대표 시공 사례. STEP 1 MVP에서는 플레이스홀더로 구성하고,
 * 실제 포트폴리오 이미지는 콘텐츠 확보 후 교체한다.
 */
export function PortfolioSection() {
  return (
    <section id="portfolio" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Portfolio"
          title="26년의 경험이 만든 공간들"
          description="상업공간, 교회, 교육시설, 오피스, 주거공간까지 다양한 프로젝트를 함께해왔습니다."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {PROJECTS.map((p) => (
            <div
              key={p.name}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted"
            >
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-primary/70 via-transparent to-transparent p-5">
                <div className="text-primary-foreground">
                  <p className="text-xs uppercase tracking-wider opacity-80">{p.category}</p>
                  <p className="font-semibold">{p.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
