import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Reveal from "@/components/Reveal";
import { Hero } from "@/components/home/Hero";
import { ServicesSection } from "@/components/home/ServicesSection";
import { AboutSection } from "@/components/home/AboutSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { PortfolioSection } from "@/components/home/PortfolioSection";
import { GBrickSection } from "@/components/home/GBrickSection";
import { MenuSection } from "@/components/home/MenuSection";
import { TrustSection } from "@/components/home/TrustSection";
import { CTASection } from "@/components/home/CTASection";

/**
 * 홈페이지 (STEP 1).
 * 섹션 순서: Hero → Portfolio → Services → About → Process → GBrick → Menu → Trust → Contact
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
        <Reveal><MenuSection /></Reveal>
        <Reveal><TrustSection /></Reveal>
        <Reveal><CTASection /></Reveal>
      </main>
      <Footer />
    </>
  );
}
