import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Studio from "@/components/Studio";

export const metadata: Metadata = {
  title: "AI 디자인 스튜디오",
  description:
    "사진 한 장으로 시작하는 DesignFOBEE AI 디자인. 로그인 없이 공간 사진을 올리고 원하는 스타일을 고르면 AI가 새로운 인테리어를 제안합니다.",
};

/**
 * AI 디자인 스튜디오 (무로그인 즉시 체험).
 * ReRoom AI 프로토타입의 검증된 Studio UI를 DesignFOBEE 브랜드·공통 셸에 이식.
 * 홈의 "AI 상담 시작하기" CTA가 이 화면(이미지 업로드)으로 진입한다.
 */
export default function DesignPage() {
  return (
    <div className="bg-paper text-ink">
      <Header />
      <main>
        <section className="border-b border-line bg-paper-raised">
          <div className="mx-auto max-w-6xl px-6 py-10 text-center md:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clay">
              DesignFOBEE AI Studio
            </p>
            <h1 className="font-display mx-auto mt-3 max-w-2xl text-2xl font-bold leading-[1.3] tracking-tight text-ink md:text-4xl md:leading-[1.25]">
              사진 한 장으로, 공간의 <em className="not-italic text-clay">분위기</em>를 다시 짓다
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-soft md:text-base">
              방 사진을 올리고 스타일을 고르면 AI가 공간을 다시 디자인합니다. 로그인 없이 아래에서 바로 시작하세요.
            </p>
            <div className="mx-auto mt-5 flex max-w-xl flex-col items-center gap-2 rounded-2xl border border-line bg-paper px-5 py-3 text-xs text-ink-soft sm:flex-row sm:justify-center sm:gap-3 sm:text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-clay" />
                무료 체험 2회 제공
              </span>
              <span className="hidden text-line-strong sm:inline">·</span>
              <span>
                개인 Gemini API Key를 연결하면 본인의 API 사용량 기준으로 계속 이용할 수 있습니다.
              </span>
            </div>
          </div>
        </section>

        <Studio />
      </main>
      <Footer />
    </div>
  );
}
