import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { FOUNDED_YEAR, yearsSince } from "@/lib/company/profile";

/**
 * 홈 첫 화면 — 브랜드 먼저(공간디자인 26년) + 실제 공간사진 풀블리드.
 * AI는 보조 CTA. CTA 2트랙: 상담·견적 문의(신뢰) / AI로 미리보기(/design).
 * (Creative Director 방향: ArchDaily·Apple급 공간 압도 + DesignFOBEE 브랜드 우선)
 */
export function Hero() {
  return (
    <section id="top" className="relative min-h-[88vh] w-full overflow-hidden bg-primary text-white">
      {/* 풀블리드 공간 사진 — gbrick-eunpyeong.jpg는 2026-07-28 삭제됨(은평본점 사진 미확보).
          2026-07-29 대표님이 새 사진(디자인포비작업사진2 IMG_8205)을 은평본점 야간 외관으로
          직접 확인해주셔서, 임시로 썼던 안산점 사진 대신 이 확정 본점 사진으로 교체. */}
      <Image
        src="/images/portfolio/website/designfobee-gbrick-storefront-night-01.webp"
        alt="GBRICK Coffee 은평본점 야간 매장 외관 — DesignFOBEE 설계·시공"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* 가독성 오버레이 */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/35" />

      <div className="container-px relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end pb-20 pt-32 sm:pb-28">
        <p className="animate-fade-in-up text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
          DesignFOBEE · {yearsSince(FOUNDED_YEAR)}년 공간디자인
        </p>

        <h1
          className="animate-fade-in-up mt-4 max-w-3xl text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl"
          style={{ animationDelay: "0.1s" }}
        >
          공간을 넘어,
          <br />
          경험을 디자인합니다
        </h1>

        <p
          className="animate-fade-in-up mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
          style={{ animationDelay: "0.2s" }}
        >
          상업공간·교회·오피스·카페·주거까지 {yearsSince(FOUNDED_YEAR)}년. 이제 AI로 사진 한 장이면
          공간 분석·디자인 제안·예상 견적을 미리 받아보세요.
        </p>

        <div className="animate-fade-in-up mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "0.3s" }}>
          <a
            href="#contact"
            className={buttonVariants({ size: "lg", className: "bg-white !text-primary font-semibold hover:bg-white/90" })}
          >
            상담·견적 문의하기
          </a>
          <a
            href="/design"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "border-white/40 bg-white/5 text-white backdrop-blur hover:bg-white hover:text-primary",
            })}
          >
            AI로 공간 미리보기
          </a>
        </div>

        <p className="animate-fade-in-up mt-3 text-xs text-white/60" style={{ animationDelay: "0.4s" }}>
          로그인 없이, 30초 만에 무료로 확인할 수 있습니다.
        </p>
      </div>
    </section>
  );
}
