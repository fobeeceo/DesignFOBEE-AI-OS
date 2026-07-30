import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";

/**
 * 가맹상담 랜딩 Hero — 저가 커피가 아닌 "공간 중심 브랜드" 포지셔닝을 첫 화면에서 명확히 한다.
 * 이미지는 실제 은평본점 야간 외관(대표 확인 자산)만 사용한다.
 */
export function FranchiseHero() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/images/portfolio/website/designfobee-gbrick-storefront-night-01.webp"
        alt="GBRICK Coffee 은평본점 야간 매장 외관 — DesignFOBEE 설계·시공"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-black/60" />

      <div className="container-px mx-auto flex min-h-[560px] max-w-6xl flex-col justify-center py-20 text-white sm:py-28">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
          GBRICK Coffee Franchise
        </span>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          성공하는 카페는
          <br />
          공간부터 다릅니다
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
          GBRICK Coffee는 설계부터 시공, 브랜딩, 운영, 교육까지 본사가 함께합니다.
          26년간 상업공간을 직접 설계·시공해온 디자인포비가 매장을 직접 만듭니다.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a href="#consult" className={buttonVariants({ size: "lg" })}>
            무료 가맹상담 신청
          </a>
          <a
            href="#advantages"
            className={buttonVariants({ variant: "outline", size: "lg", className: "border-white text-white hover:bg-white hover:text-foreground" })}
          >
            왜 GBRICK인가?
          </a>
        </div>
      </div>
    </section>
  );
}
