"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";

/**
 * 홈 첫 화면 — 브랜드 먼저(공간디자인 26년) + 실제 공간사진 풀블리드.
 * AI는 보조 CTA. CTA 2트랙: 상담·견적 문의(신뢰) / AI로 미리보기(/design).
 * (Creative Director 방향: ArchDaily·Apple급 공간 압도 + DesignFOBEE 브랜드 우선)
 */
export function Hero() {
  return (
    <section id="top" className="relative min-h-[88vh] w-full overflow-hidden bg-primary text-white">
      {/* 풀블리드 공간 사진 */}
      <Image
        src="/images/portfolio/gbrick-eunpyeong.jpg"
        alt="DesignFOBEE가 설계·시공한 GBRICK Coffee 공간"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* 가독성 오버레이 */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/35" />

      <div className="container-px relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end pb-20 pt-32 sm:pb-28">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80"
        >
          DesignFOBEE · 26년 공간디자인
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-4 max-w-3xl text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl"
        >
          공간을 넘어,
          <br />
          경험을 디자인합니다
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
        >
          상업공간·교회·오피스·카페·주거까지 26년. 이제 AI로 사진 한 장이면
          공간 분석·디자인 제안·예상 견적을 미리 받아보세요.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex flex-col gap-3 sm:flex-row"
        >
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
        </motion.div>
      </div>
    </section>
  );
}
