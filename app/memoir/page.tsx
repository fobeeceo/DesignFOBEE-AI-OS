import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MemoirLanding } from "@/components/memoir/MemoirLanding";

export const metadata = {
  title: "자서전 코너 — 질문에 답하면 한 권이 됩니다 | DesignFOBEE",
  description:
    "순서대로 드리는 질문에 휴대폰으로 답하면 자서전 원고가 됩니다. 말로 답해도 글이 되고, 원고는 언제든 파일로 내려받을 수 있습니다.",
  alternates: { canonical: "/memoir" },
};

export default function MemoirPage() {
  return (
    <>
      <Header />
      <main className="bg-[#F6F4F0] px-5 pb-20 pt-10 text-[#1B1815]">
        <MemoirLanding />
      </main>
      <Footer />
    </>
  );
}
