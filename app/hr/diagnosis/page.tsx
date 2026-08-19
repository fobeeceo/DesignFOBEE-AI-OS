import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DiagnosisClient } from "@/components/hr/DiagnosisClient";

export const metadata = {
  title: "직원·알바 채용 사전 진단 — GBRICK Coffee",
  description:
    "GBRICK Coffee 직원·알바 채용 사전 진단. 25문항 약 5분, 연락처 없이 즉시 결과를 확인하실 수 있습니다. 본 진단은 참고용 사전 자료이며 채용 여부를 확정하지 않습니다.",
  alternates: { canonical: "/hr/diagnosis" },
};

export default function HrDiagnosisPage() {
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
