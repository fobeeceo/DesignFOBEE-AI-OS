import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Reveal from "@/components/Reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { FranchiseHero } from "@/components/franchise/FranchiseHero";
import { TrustSection } from "@/components/franchise/TrustSection";
import { Advantages } from "@/components/franchise/Advantages";
import { OperatingStores } from "@/components/franchise/OperatingStores";
import { SpaceExpertise } from "@/components/franchise/SpaceExpertise";
import { Process } from "@/components/franchise/Process";
import { FAQ } from "@/components/franchise/FAQ";
import { ConsultForm } from "@/components/franchise/ConsultForm";
import { FloatingCTA } from "@/components/franchise/FloatingCTA";
import { FOUNDED_YEAR, yearsSince } from "@/lib/company/profile";

export const metadata: Metadata = {
  title: "GBRICK Coffee 가맹상담 — 공간이 경쟁력이 되는 카페",
  description:
    `GBRICK Coffee 가맹 상담. ${yearsSince(FOUNDED_YEAR)}년 공간디자인 노하우로 설계부터 시공·브랜딩·운영·교육까지 본사가 직접 함께합니다. 무료 가맹상담을 신청하세요.`,
  alternates: { canonical: "/franchise" },
};

/**
 * GBRICK Coffee 가맹상담 전용 랜딩 페이지.
 * 홈페이지 GBrickSection(브랜드 요약)과 역할을 분리해, 이 페이지는 가맹 상담 전환만 담당한다.
 * 섹션 순서: Hero → 신뢰지표 → 차별성 → 운영 중인 매장 → 카페 밖의 공간 →
 *            창업절차 → FAQ → 상담폼(+FloatingCTA)
 */
export default function FranchisePage() {
  return (
    <>
      <Header />
      <main>
        <FranchiseHero />
        <TrustSection />
        <Reveal>
          <Advantages />
        </Reveal>
        {/* Reveal로 감싸지 않는다(대표 지시) — JS가 실패해도 매장 이야기는 보여야 한다. */}
        <OperatingStores />
        <SpaceExpertise />
        <Reveal>
          <Process />
        </Reveal>
        {/* FAQ도 Reveal에서 뺀다(대표 지시) — 창업 비용은 이 페이지에서 가장 중요한 정보라
            애니메이션에 노출을 맡기지 않는다. */}
        <FAQ />

        <section id="consult" className="py-20 sm:py-28">
          <div className="container-px mx-auto max-w-3xl">
            <SectionHeading
              eyebrow="Consultation"
              title="무료 가맹상담 신청"
              description="창업 조건을 함께 남겨주시면 전문 컨설턴트가 확인 후 더 정확하게 안내드립니다."
            />
            <div className="mt-12">
              <ConsultForm />
            </div>
          </div>
        </section>
      </main>
      <FloatingCTA />
      <Footer />
    </>
  );
}
