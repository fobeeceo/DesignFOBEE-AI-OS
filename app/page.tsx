import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Reveal from "@/components/Reveal";
import { Hero } from "@/components/home/Hero";
import { ServicesSection } from "@/components/home/ServicesSection";
import { AboutSection } from "@/components/home/AboutSection";
import { CeoSection } from "@/components/home/CeoSection";
import { ProofSection } from "@/components/home/ProofSection";
import { ChurchSection } from "@/components/home/ChurchSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { PortfolioSection } from "@/components/home/PortfolioSection";
import { GBrickSection } from "@/components/home/GBrickSection";
import { CTASection } from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "DesignFOBEE — 26년 공간디자인 × AI 공간 설계",
  description:
    "상업공간·교회·오피스·카페·주거까지 26년간 직접 설계·시공해온 디자인포비. GBRICK Coffee 브랜드 공간부터 AI 공간 분석·디자인 제안·예상 견적까지 한 번에 확인하세요.",
};

/**
 * 홈페이지 (STEP 1).
 * 섹션 순서: Hero → Portfolio → Services → About → Process → GBrick → Contact
 * (신뢰지표는 GBrickSection 자체 통계 그리드에 이미 표시되어 있어, 바로 아래 독립
 * TrustSection에서 같은 숫자를 한 번 더 보여주던 중복을 제거했다. 지표는 CEO 업무지시에
 * 따라 매장 수·폐점 수 등 변동 수치를 제외하고 변하지 않는 지표로 구성되어 있다.)
 */
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Reveal><ProofSection /></Reveal>
        <Reveal><PortfolioSection /></Reveal>
        <Reveal><ServicesSection /></Reveal>
        <Reveal><AboutSection /></Reveal>
        <Reveal><CeoSection /></Reveal>
        <Reveal><ChurchSection /></Reveal>
        <Reveal><ProcessSection /></Reveal>
        <Reveal><GBrickSection /></Reveal>
        <Reveal><CTASection /></Reveal>
      </main>
      <Footer />
    </>
  );
}
