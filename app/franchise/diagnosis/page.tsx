import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DiagnosisClient } from "@/components/franchise/DiagnosisClient";

export const metadata: Metadata = {
  title: "창업 가능성 자가진단 — GBRICK Coffee 가맹",
  description:
    "GBRICK Coffee 가맹 사전 진단. 20문항 약 4분, 연락처 없이 즉시 결과를 확인하실 수 있습니다. 실제로 성공한 점주들의 공통점을 기준으로 만들었습니다.",
  alternates: { canonical: "/franchise/diagnosis" },
};

/**
 * 가맹 창업 가능성 자가진단 페이지.
 * ⚠️ Reveal 미사용 — JS가 실패해도 문항이 항상 보여야 한다.
 */
export default function DiagnosisPage() {
  return (
    <>
      <Header />
      <main className="bg-[#F6F4F0] px-5 pb-16 pt-9 text-[#1B1815]">
        <DiagnosisClient />
      </main>
      <Footer />
    </>
  );
}
