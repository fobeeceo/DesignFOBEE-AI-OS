import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  COMPANY,
  MILESTONES,
  SERVICES,
  FOUNDED_YEAR,
  getStats,
  yearsSince,
} from "@/lib/company/profile";
import { WORK_GALLERY } from "@/lib/portfolio/workGallery";

export const metadata: Metadata = {
  title: "회사소개",
  description: `${COMPANY.name} — ${COMPANY.founded} 설립, ${yearsSince(FOUNDED_YEAR)}년간 상업공간·오피스·교회 등을 직접 설계·시공해온 공간디자인 전문기업입니다.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      <Header />
      <main>
        {/* 인트로 */}
        <section className="border-b border-border py-20 sm:py-28">
          <div className="container-px mx-auto max-w-4xl text-center">
            <span className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
              Company
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              공간을 넘어, 경험을 만듭니다
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {COMPANY.name}는 {COMPANY.founded} 설립된 공간디자인 전문기업입니다. 2009년
              실내건축공사업 등록을 마치고, 상업공간·오피스·교회·교육시설까지 다양한 공간을
              직접 설계·시공해왔습니다. 예쁜 공간을 만드는 것을 넘어, 그 공간에서 사람들이 더
              나은 경험을 하도록 돕는 것이 저희의 일입니다.
            </p>
          </div>
        </section>

        {/* 숫자로 보는 디자인포비 */}
        <section className="py-16 sm:py-20">
          <div className="container-px mx-auto max-w-6xl">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {getStats().map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-bold text-accent sm:text-4xl">{s.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 연혁 */}
        <section className="bg-muted/40 py-20 sm:py-28">
          <div className="container-px mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="History"
              title={`${yearsSince(FOUNDED_YEAR)}년의 발자취`}
            />
            <div className="relative mt-14 space-y-8 border-l border-border pl-8 sm:pl-10">
              {MILESTONES.map((m) => (
                <div key={m.year} className="relative">
                  <span className="absolute -left-[41px] top-1 h-3 w-3 rounded-full bg-accent sm:-left-[45px]" />
                  <span className="text-xs font-semibold text-accent">{m.year}</span>
                  <p className="mt-1 text-lg font-semibold">{m.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 사업 영역 */}
        <section className="py-20 sm:py-28">
          <div className="container-px mx-auto max-w-6xl">
            <SectionHeading eyebrow="Business Areas" title="우리가 다루는 공간" />
            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {SERVICES.map((s) => (
                <div key={s.title} className="rounded-2xl border border-border bg-background p-6">
                  <p className="font-semibold">{s.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 작업 사례 미리보기 */}
        <section className="bg-muted/40 py-20 sm:py-28">
          <div className="container-px mx-auto max-w-6xl">
            <SectionHeading eyebrow="Work" title="우리가 만든 공간들" />
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {WORK_GALLERY.slice(0, 8).map((item) => (
                <div key={item.slug} className="group relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={`/images/portfolio/website/${item.slug}.webp`}
                    alt={item.caption}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(min-width: 640px) 25vw, 50vw"
                  />
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <a href="/#portfolio" className="text-sm font-medium text-accent hover:underline">
                포트폴리오 전체 보기 →
              </a>
            </div>
          </div>
        </section>

        {/* 연락처 */}
        <section className="py-20 sm:py-28">
          <div className="container-px mx-auto max-w-4xl text-center">
            <SectionHeading eyebrow="Contact" title="함께 만들고 싶은 공간이 있다면" />
            <div className="mt-8 flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <p>{COMPANY.name} · 대표이사 {COMPANY.ceo}</p>
              <p>
                <a href={`tel:${COMPANY.phone.replace(/-/g, "")}`} className="hover:text-accent">
                  {COMPANY.phone}
                </a>
                {" · "}
                <a href={`mailto:${COMPANY.email}`} className="hover:text-accent">
                  {COMPANY.email}
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
