"use client";

import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { COMPANY } from "@/lib/company/profile";
import { cn } from "@/lib/utils";

/**
 * 스크롤 중 항상 상담 접점을 유지하는 CTA.
 * Hero를 지난 뒤부터 노출하고, 상담 폼이 화면에 들어오면 숨긴다(중복 CTA 방지).
 * 모바일은 하단 고정바(전화 + 신청), 데스크톱은 우측 하단 플로팅 버튼.
 */
export function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consult = document.getElementById("consult");

    function update() {
      const pastHero = window.scrollY > 480;
      const formInView = consult
        ? consult.getBoundingClientRect().top < window.innerHeight * 0.9
        : false;
      setVisible(pastHero && !formInView);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 transition-opacity duration-200 sm:inset-x-auto sm:bottom-8 sm:right-8",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      {/* 숨김 상태에서는 탭 이동 대상에서도 빼야 한다(aria-hidden 안에 포커스 가능한 요소가
          남아 있으면 키보드 사용자가 보이지 않는 버튼에 포커스된다). */}
      <div className="flex gap-2 border-t border-border bg-background/95 p-3 backdrop-blur sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <a
          href={`tel:${COMPANY.phone.replace(/-/g, "")}`}
          tabIndex={visible ? undefined : -1}
          className={buttonVariants({ variant: "outline", size: "lg", className: "flex-1 sm:hidden" })}
        >
          전화 상담
        </a>
        <a
          href="#consult"
          tabIndex={visible ? undefined : -1}
          className={buttonVariants({ size: "lg", className: "flex-1 shadow-lg sm:flex-none" })}
        >
          무료 가맹상담 신청
        </a>
      </div>
    </div>
  );
}
