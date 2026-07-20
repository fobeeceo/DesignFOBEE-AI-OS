"use client";

import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";

/**
 * 홈페이지 첫 화면. 3초 안에 "AI + 공간디자인" 포지셔닝을 전달하고
 * CTA로 상담 신청(추후 STEP 3 사진업로드)으로 유도한다.
 */
export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="container-px mx-auto flex min-h-[85vh] max-w-6xl flex-col justify-center gap-6 py-24 sm:py-32">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs font-semibold tracking-[0.25em] text-accent uppercase"
        >
          Design FOBEE · AI Space Branding
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
        >
          AI가 설계하는
          <br />
          당신의 공간
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-xl text-base text-primary-foreground/70 sm:text-lg leading-relaxed"
        >
          26년 공간디자인 경험과 AI가 만나 사진 한 장으로 공간 분석, 디자인 제안,
          예상 견적까지 받아보세요.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <a
            href="/design"
            className={buttonVariants({
              size: "lg",
              className: "bg-accent text-accent-foreground hover:opacity-90",
            })}
          >
            AI 상담 시작하기
          </a>
          <a
            href="#process"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary",
            })}
          >
            진행 과정 보기
          </a>
        </motion.div>
      </div>
    </section>
  );
}
