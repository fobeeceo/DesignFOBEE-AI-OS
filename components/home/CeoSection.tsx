import { SectionHeading } from "@/components/ui/section-heading";
import { CEO_PROFILE, COMPANY, FOUNDED_YEAR, yearsSince } from "@/lib/company/profile";

/**
 * 대표 소개 — CEO 업무지시(홈페이지 신뢰도 강화 Priority 3).
 * 내용은 lib/company/profile.ts의 CEO_PROFILE(대표님이 직접 제시한 항목)만 사용한다.
 * 대표 사진은 보유 자산이 없고 스톡 이미지 사용이 금지되어 있어 텍스트 구성으로 대체했다.
 */
export function CeoSection() {
  return (
    <section id="ceo" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Founder"
          title={`${yearsSince(FOUNDED_YEAR)}년간 현장을 지켜온 사람`}
          description={CEO_PROFILE.intro}
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:items-start">
          <div className="rounded-2xl border border-border bg-muted/40 p-8">
            <p className="text-xl font-bold">{CEO_PROFILE.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {COMPANY.name} {CEO_PROFILE.title}
            </p>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              공간은 예뻐 보이는 것으로 끝나지 않습니다. 그 안에서 일하고, 머물고, 모이는 사람들의
              경험이 달라져야 제대로 만든 공간입니다.
            </p>
            <a
              href="/about"
              className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
            >
              회사소개 자세히 보기 →
            </a>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {CEO_PROFILE.careers.map((item) => (
              <li key={item.label} className="rounded-2xl border border-border p-6">
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
