import { PrintClient } from "@/components/memoir/PrintClient";

export const metadata = {
  title: "원고 인쇄 · PDF로 저장 — DesignFOBEE 자서전 코너",
  description: "자서전 원고를 인쇄하거나 PDF로 저장합니다.",
  alternates: { canonical: "/memoir/print" },
  /** 인쇄 전용 화면이라 검색에 걸릴 이유가 없다. sitemap에도 넣지 않는다. */
  robots: { index: false, follow: false },
};

/**
 * 인쇄 전용 화면. Header·Footer를 두지 않는다 —
 * 인쇄물에 사이트 메뉴가 딸려 나가면 안 된다.
 */
export default function MemoirPrintPage() {
  return (
    <main className="min-h-screen bg-[#F6F4F0]">
      <PrintClient />
    </main>
  );
}
