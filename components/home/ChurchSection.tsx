import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { FOUNDED_YEAR, yearsSince } from "@/lib/company/profile";

/**
 * 교회 인테리어 전문성 — CEO 업무지시(홈페이지 신뢰도 강화 Priority 5) "별도 구성".
 * 사진은 전부 실제 시공 현장이며, 참석자 얼굴은 마스킹 처리된 자산만 사용한다
 * (2026-07-30 대표 지시로 마스킹 완료된 4장 + 사람이 없는 부속공간 사진).
 */
const CHURCH_WORKS = [
  { slug: "designfobee-church-sanctuary-01", caption: "예배당 전경" },
  { slug: "designfobee-church-worship-team-01", caption: "예배당 무대" },
  { slug: "designfobee-kids-lounge-01", caption: "부속 키즈 라운지" },
];

const CHURCH_POINTS = [
  {
    title: "예배공간 설계",
    desc: "회중석 시야와 동선, 강단·음향·조명 조건을 함께 검토해 설계합니다.",
  },
  {
    title: "부속시설까지",
    desc: "키즈 라운지·카페·교육공간 등 부속시설도 하나의 흐름으로 구성합니다.",
  },
  {
    title: "운영 중 시공 대응",
    desc: "예배 일정을 피해 공정을 나눠 진행하는 방식에 익숙합니다.",
  },
];

export function ChurchSection() {
  return (
    <section id="church" className="bg-muted/40 py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Church"
          title="교회 공간, 따로 배우지 않았습니다"
          description={`${yearsSince(FOUNDED_YEAR)}년간 상업공간과 함께 교회 예배공간·부속시설을 직접 설계하고 시공해왔습니다. 공간의 용도와 공동체의 사용 방식을 먼저 이해하고 설계합니다.`}
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {CHURCH_WORKS.map((item) => (
            <figure key={item.slug} className="overflow-hidden rounded-2xl bg-background">
              <div className="relative aspect-[4/3]">
                <Image
                  src={`/images/portfolio/website/${item.slug}.webp`}
                  alt={`디자인포비 교회 시공 사례 — ${item.caption}`}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="p-4 text-sm text-muted-foreground">{item.caption}</figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          ※ 실제 시공 현장 사진이며, 참석자 얼굴은 개인정보 보호를 위해 마스킹 처리했습니다.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {CHURCH_POINTS.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-background p-6">
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a href="/#contact" className={buttonVariants({ size: "lg" })}>
            교회 인테리어 상담 신청
          </a>
        </div>
      </div>
    </section>
  );
}
