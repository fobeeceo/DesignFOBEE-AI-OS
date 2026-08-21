import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BookClient } from "@/components/memoir/BookClient";

export const metadata = {
  title: "내 원고 — DesignFOBEE 자서전 코너",
  description: "지금까지 쓴 자서전 원고의 분량과 장별 진행을 확인하고, 파일로 내려받습니다.",
  alternates: { canonical: "/memoir/book" },
};

export default function MemoirBookPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F6F4F0] px-5 pb-20 pt-8 text-[#1B1815]">
        <BookClient />
      </main>
      <Footer />
    </>
  );
}
