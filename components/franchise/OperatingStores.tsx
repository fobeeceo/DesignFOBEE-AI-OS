import { SectionHeading } from "@/components/ui/section-heading";
import { OPERATING_STORE_STORIES } from "@/lib/franchise/content";
import { yearsSince } from "@/lib/company/profile";

/**
 * 운영 중인 매장 — 기존 "성공사례" 자리를 대체한다(2026-08-01 대표 지시).
 *
 * 폐점한 매장을 성공사례로 내걸지 않기 위해, 지금 영업 중인 매장만 사실 그대로 싣는다.
 * 매장의 나이가 아니라 점주가 브랜드를 지켜온 시간을 말하는 것이 이 섹션의 목적이다.
 *
 * ⚠️ Reveal을 쓰지 않고 opacity:0으로 시작하지 않는다(대표 지시).
 *    JS가 실패해도 문구가 보여야 한다 — iOS Safari 이미지 미표시 사고(84e965d)의 재발 방지.
 * ⚠️ 본문 15px 이상. 예비 창업자 상당수가 40~60대다.
 */
export function OperatingStores() {
  return (
    <section id="stores" className="bg-muted/40 py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Stores"
          title="운영 중인 매장"
          description="오래 남은 매장에는 공통점이 있습니다. 점주님이 자리를 지켰다는 것입니다."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {OPERATING_STORE_STORIES.map((item) => (
            <article
              key={item.name}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-7"
            >
              <div className="flex items-baseline gap-2">
                <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                <span className="text-sm text-muted-foreground">{item.meta}</span>
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {item.story(yearsSince(item.since))}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
