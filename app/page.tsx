import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { ServicesSection } from "@/components/home/ServicesSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { PortfolioSection } from "@/components/home/PortfolioSection";
import { GBrickSection } from "@/components/home/GBrickSection";
import { TrustSection } from "@/components/home/TrustSection";
import { CTASection } from "@/components/home/CTASection";

/**
 * 홈페이지 (STEP 1).
 * 섹션 순서: Hero → Services → Process → Portfolio → GBrick → Trust → Contact
 */
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <PortfolioSection />
        <ServicesSection />
        <ProcessSection />
        <GBrickSection />
        <TrustSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
