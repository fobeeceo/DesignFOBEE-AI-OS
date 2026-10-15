import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Reveal from "@/components/Reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { FranchiseHero } from "@/components/franchise/FranchiseHero";
import { TrustSection } from "@/components/franchise/TrustSection";
import { Advantages } from "@/components/franchise/Advantages";
import { MenuSection } from "@/components/franchise/MenuSection";
import { SectionNav } from "@/components/franchise/SectionNav";
import { OperatingStores } from "@/components/franchise/OperatingStores";
import { SpaceExpertise } from "@/components/franchise/SpaceExpertise";
import { Process } from "@/components/franchise/Process";
import { CostSection } from "@/components/franchise/CostSection";
import { FAQ } from "@/components/franchise/FAQ";
import { ConsultForm } from "@/components/franchise/ConsultForm";
import { FloatingCTA } from "@/components/franchise/FloatingCTA";
import { FOUNDED_YEAR, yearsSince } from "@/lib/company/profile";

export const metadata: Metadata = {
  title: "GBRICK Coffee 가맹상담 — 공간이 경쟁력이 되는 카페",
  description:
    `GBRICK Coffee 가맹 상담. ${yearsSince(FOUNDED_YEAR)}년 공간디자인 노하우로 설계부터 시공·브랜딩·운영·교육까지 본사가 직접 함께합니다. 무료 가맹상담을 신청하세요.`,
  alternates: { canonical: "/franchise" },
  // 영상·블로그에서 이 주소를 공유하면 카카오톡·인스타 미리보기에 가맹 안내가 떠야 한다(2026-10-15 대표 지시).
  // 지정하지 않으면 app/layout.tsx의 DesignFOBEE 홈 미리보기가 그대로 나온다.
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/franchise",
    siteName: "GBRICK Coffee",
    title: "GBRICK Coffee 가맹상담 — 차가운 음료가 강한 카페",
    description:
      "아이스 아메리카노·라떼, 과일 요거트 라씨, 국산 수제 팥빙수, 수제청 음료. 메뉴와 창업 비용을 확인하고 무료 가맹상담을 신청하세요.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "GBRICK Coffee 은평본점 야간 매장 외관" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GBRICK Coffee 가맹상담 — 차가운 음료가 강한 카페",
    description: "아이스 음료·라씨·수제 팥빙수·수제청 음료. 메뉴와 창업 비용을 확인하세요.",
    images: ["/og-image.jpg"],
  },
};

/**
 * GBRICK Coffee 가맹상담 전용 랜딩 페이지.
 * 홈페이지 GBrickSection(브랜드 요약)과 역할을 분리해, 이 페이지는 가맹 상담 전환만 담당한다.
 * 섹션 순서: Hero → 바로가기 → 대표 메뉴 → 신뢰지표 → 차별성 → 운영 중인 매장 →
 *            카페 밖의 공간 → 창업절차 → 창업비용 → FAQ → 상담폼(+FloatingCTA)
 */
export default function FranchisePage() {
  return (
    <>
      <Header />
      {/* 바로가기 바(SectionNav)와 헤더에 섹션 제목이 가리지 않게 scroll-margin을 준다. */}
      <main className="[&_section[id]]:scroll-mt-32">
        <FranchiseHero />
        <SectionNav />
        {/* 메뉴는 Hero 바로 아래(2026-10-15 대표 지시). */}
        <MenuSection />
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
        {/* 창업 비용은 이 페이지에서 가장 중요한 정보라 Reveal로 감싸지 않는다. */}
        <CostSection />
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
