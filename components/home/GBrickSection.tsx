import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { STATS } from "@/lib/company/profile";
import { Coffee } from "lucide-react";

/**
 * 홈페이지 GBRICK Coffee 요약 섹션.
 * CEO 업무지시(가맹상담 시스템 구축): 상담 폼을 여기서 제거하고 전용 랜딩(/franchise)으로
 * 유도만 한다 — 이 섹션은 브랜드 요약, /franchise는 상담 전환을 담당하도록 역할을 분리했다.
 * 통계는 lib/company/profile.ts STATS 재사용(SSOT) — 매장 수·폐점 수 등 변동 수치는 쓰지 않는다.
 */
export function GBrickSection() {
  return (
    <section id="gbrick" className="py-20 sm:py-28">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Franchise"
          title="GBRICK Coffee 가맹 상담"
          description="공간과 커피를 결합한 브랜드. 고객은 커피가 아니라 좋은 공간을 경험하러 옵니다 — 26년 공간디자인 노하우가 매장 설계에 그대로 들어갑니다."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="/images/portfolio/website/designfobee-gbrick-storefront-night-01.webp"
              alt="GBRICK Coffee 은평본점 야간 매장 외관"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-muted/40 p-6 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-accent">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coffee className="h-4 w-4 text-accent" />
              매장 설계·시공을 본사가 직접 책임집니다 — 외주 인테리어 업체를 따로 찾을 필요가 없습니다.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="/franchise" className={buttonVariants({ size: "lg" })}>
                가맹상담 자세히 보기
              </a>
              <a
                href="/franchise#consult"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                무료 가맹상담 신청
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
