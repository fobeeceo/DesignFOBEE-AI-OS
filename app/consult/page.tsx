import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ConsultIntro } from "@/components/consult/ConsultIntro";
import { SpaceConsultForm } from "@/components/consult/SpaceConsultForm";

export const metadata: Metadata = {
  title: "공간 상담 — 도면 한 장으로 시작합니다",
  description:
    "도면을 보내주시면 실제 마감재와 조명을 반영한 3D 시안을 만들어 보내드립니다. 손으로 그린 스케치도 괜찮습니다. 시안 제작과 현장 실측, 견적까지 비용은 없습니다.",
  alternates: { canonical: "/consult" },
};

/**
 * 공간 상담 페이지 — 도면을 받아 3D 시안을 보내드리는 전환 경로.
 * 원본: fobee-space-consult.html (대표 제공)
 *
 * ⚠️ Reveal로 감싸지 않는다(대표 지시). JS가 실패해도 도면 접수 안내와 폼은 보여야 한다.
 */
export default function ConsultPage() {
  return (
    <>
      <Header />
      <main className="container-px mx-auto max-w-[620px] pb-20">
        <ConsultIntro />
        <hr className="my-10 border-border" />
        <SpaceConsultForm />
      </main>
      <Footer />
    </>
  );
}
