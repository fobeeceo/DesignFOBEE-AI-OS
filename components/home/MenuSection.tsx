import { SectionHeading } from "@/components/ui/section-heading";
import { DESSERT_MENU, won } from "@/lib/menu/dessertMenu";

/**
 * GBRICK Coffee 디저트 메뉴 — 실제 판매 품목·가격(SSOT: lib/menu/dessertMenu.ts).
 */
export function MenuSection() {
  return (
    <section id="menu" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Menu"
          title="GBRICK Coffee 디저트"
          description="매장에서 직접 판매 중인 디저트 메뉴입니다. 커피와 함께 즐겨보세요."
        />

        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {DESSERT_MENU.map((item) => (
            <div
              key={item.name}
              className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2.5"
            >
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              <span className="whitespace-nowrap text-sm font-semibold text-muted-foreground">
                {won(item.price)}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          매장 사정에 따라 일부 품목이 소진되거나 가격이 변경될 수 있습니다.
        </p>
      </div>
    </section>
  );
}
