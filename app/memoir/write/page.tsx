import { Header } from "@/components/layout/Header";
import { WriteClient } from "@/components/memoir/WriteClient";

export const metadata = {
  title: "자서전 쓰기 — DesignFOBEE 자서전 코너",
  description: "질문에 하나씩 답하며 자서전 원고를 만듭니다. 말로 답해도 글이 됩니다.",
  alternates: { canonical: "/memoir/write" },
};

/**
 * 쓰기 화면은 Footer를 두지 않는다 — 질문에 집중하는 화면이고,
 * 모바일에서 답변 칸 아래에 링크가 늘어서면 오히려 방해가 된다.
 */
export default function MemoirWritePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F6F4F0] px-5 pb-20 pt-8 text-[#1B1815]">
        <WriteClient />
      </main>
    </>
  );
}
