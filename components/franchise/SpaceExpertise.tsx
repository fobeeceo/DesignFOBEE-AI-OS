import Image from "next/image";
import { getCasesByCodes } from "@/lib/franchise/successCases";

/**
 * 카페 밖의 공간 — 교회 등 비(非)매장 시공 사례.
 *
 * 「운영 중인 매장」과 의도적으로 분리한다(2026-08-01 대표 지시).
 * 위 섹션은 "가맹점이 얼마나 오래 갔는가"를 말하고, 이 섹션은 "본사가 어떤 공간까지
 * 직접 시공하는가"를 말한다. 성격이 다른 둘을 한 그리드에 섞으면 교회 시공이
 * 가맹 성공사례처럼 읽히기 때문에, 레이아웃도 카드 그리드가 아닌 가로 배치로 다르게 둔다.
 *
 * ⚠️ Reveal 미사용, opacity:0 미사용. 본문 15px.
 */
export function SpaceExpertise() {
  const cases = getCasesByCodes(["SUCCESS-004"]);
  if (cases.length === 0) return null;

  return (
    <section id="expertise" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-5xl">
        {cases.map((item) => (
          <div
            key={item.code}
            className="grid gap-8 overflow-hidden rounded-2xl border border-border bg-background sm:grid-cols-2"
          >
            <div className="relative min-h-[220px] sm:min-h-full">
              <Image
                src={item.image}
                alt={`${item.title} — ${item.location}`}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col justify-center gap-3 p-7 sm:py-10 sm:pr-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Beyond Cafe
              </span>
              <h2 className="text-xl font-semibold leading-snug text-foreground">
                카페만 시공하는 것은 아닙니다
              </h2>
              <p className="text-sm text-muted-foreground">{item.location}</p>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{item.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
