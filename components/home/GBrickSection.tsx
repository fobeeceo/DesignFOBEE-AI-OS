import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { ContactForm } from "@/components/home/ContactForm";
import { Coffee } from "lucide-react";

/**
 * GBRICK Coffee 가맹 상담 섹션 — 이전엔 브랜드 소개 2문장 + 홈 상담폼(#contact) 링크뿐이었다.
 * CEO 업무지시(Sprint 2 P1): 가맹 상담을 인테리어 상담과 완전히 분리 — 이 섹션 자체가
 * 독립된 랜딩(실제 매장 사진 + 신뢰 수치) + 전용 폼(variant="franchise")을 갖는다.
 * 통계는 lib/company/profile.ts STATS와 동일 SSOT — 매장 수·폐점 수 등 변동 수치는
 * CEO 업무지시(신뢰지표 개선)로 제외하고 변하지 않는 지표만 노출한다.
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
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">26년</p>
                <p className="mt-1 text-xs text-muted-foreground">공간을 만들어온 시간</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">직접 설계·시공</p>
                <p className="mt-1 text-xs text-muted-foreground">One Stop Service</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">AI 기반 설계</p>
                <p className="mt-1 text-xs text-muted-foreground">Design AI</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">10년+</p>
                <p className="mt-1 text-xs text-muted-foreground">운영 노하우</p>
              </div>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coffee className="h-4 w-4 text-accent" />
              매장 설계·시공을 본사가 직접 책임집니다 — 외주 인테리어 업체를 따로 찾을 필요가 없습니다.
            </p>
            <ContactForm variant="franchise" />
          </div>
        </div>
      </div>
    </section>
  );
}
