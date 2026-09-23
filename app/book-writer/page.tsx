import { Header } from "@/components/layout/Header";
import { BookWriterClient } from "@/components/bookwriter/BookWriterClient";

/**
 * 책 집필 도구. 대외 노출(메뉴·사이트맵·검색 색인)은 대표 확인 후에 연다 —
 * 그때까지는 주소를 아는 사람만 들어온다(AI-DEV-RULES §2 대외 문구).
 */
export const metadata = {
  title: "책 집필 도구 | DesignFOBEE",
  description: "아이디어 → 기획서 → 목차 → 장면 → 초안 순서로 AI와 함께 책 한 권을 씁니다.",
  robots: { index: false, follow: false },
};

export default function BookWriterPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F6F4F0] px-5 pb-20 pt-8 text-[#1B1815]">
        <BookWriterClient />
      </main>
    </>
  );
}
