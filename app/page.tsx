import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Reveal from "@/components/Reveal";
import { Hero } from "@/components/home/Hero";
import { ServicesSection } from "@/components/home/ServicesSection";
import { AboutSection } from "@/components/home/AboutSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { PortfolioSection } from "@/components/home/PortfolioSection";
import { GBrickSection } from "@/components/home/GBrickSection";
import { TrustSection } from "@/components/home/TrustSection";
import { CTASection } from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "DesignFOBEE — 26년 공간디자인 × AI 공간 설계",
  description:
    "상업공간·교회·오피스·카페·주거까지 26년간 직접 설계·시공해온 디자인포비. GBRICK Coffee 브랜드 공간부터 AI 공간 분석·디자인 제안·예상 견적까지 한 번에 확인하세요.",
};

/**
 * 홈페이지 (STEP 1).
 * 섹션 순서: Hero → Portfolio → Services → About → Process → GBrick → Trust → Contact
 */
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Reveal><PortfolioSection /></Reveal>
        <Reveal><ServicesSection /></Reveal>
        <Reveal><AboutSection /></Reveal>
        <Reveal><ProcessSection /></Reveal>
        <Reveal><GBrickSection /></Reveal>
        <Reveal><TrustSection /></Reveal>
        <Reveal><CTASection /></Reveal>
      </main>
      <Footer />
    </>
  );
}
