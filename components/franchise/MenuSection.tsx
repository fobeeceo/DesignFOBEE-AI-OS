import { Snowflake, Citrus } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { FRANCHISE_MENU, type MenuItem } from "@/lib/franchise/content";

/**
 * 대표 메뉴 — 차가운 음료와 수제청 메뉴를 Hero 바로 아래에서 보여준다(2026-10-15 대표 지시).
 *
 * ⚠️ 메뉴 사진이 아직 없다. 사진 자리를 가짜 이미지로 채우지 않고 글자 카드로 둔다.
 *    실제 사진이 생기면 FRANCHISE_MENU의 image에 넣는다.
 * ⚠️ Reveal을 쓰지 않는다 — JS가 실패해도 메뉴는 보여야 한다(OperatingStores와 같은 이유).
 * ⚠️ 본문 15px 이상. 예비 창업자 상당수가 40~60대다.
 */
function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold tabular-nums text-sky-200">
          {String(index + 1).padStart(2, "0")}
        </span>
        {item.tag && (
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {item.tag}
          </span>
        )}
      </div>
      <h4 className="text-lg font-bold text-foreground">{item.name}</h4>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{item.desc}</p>
    </article>
  );
}

export function MenuSection() {
  const { cold, handmade } = FRANCHISE_MENU;

  return (
    <section id="menu" className="bg-gradient-to-b from-sky-50 to-background py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading eyebrow="Menu" title={FRANCHISE_MENU.title} description={FRANCHISE_MENU.lead} />

        <div className="mt-12">
          <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Snowflake className="h-5 w-5 text-sky-500" aria-hidden />
            {cold.title}
          </h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cold.items.map((item, i) => (
              <MenuCard key={item.name} item={item} index={i} />
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 sm:p-10">
          <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Citrus className="h-5 w-5 text-orange-500" aria-hidden />
            {handmade.title}
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{handmade.desc}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {handmade.items.map((item, i) => (
              <MenuCard key={item.name} item={item} index={cold.items.length + i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
