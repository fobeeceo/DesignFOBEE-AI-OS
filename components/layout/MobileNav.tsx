"use client";

import { X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: { label: string; href: string }[];
}

/**
 * 모바일 전용 풀스크린 네비게이션.
 * framer-motion 제거(번들 축소) — React 18은 inert prop을 지원하지 않아
 * "항상 마운트 + opacity 토글" 방식은 닫힌 상태에서도 키보드로 포커스가
 * 가능해지는 접근성 회귀가 있었다. 그래서 기존과 동일하게 open일 때만 마운트.
 */
export function MobileNav({ open, onClose, items }: MobileNavProps) {
  if (!open) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
      <div className="container-px flex h-16 items-center justify-between border-b border-border">
        <span className="text-lg font-bold">DesignFOBEE</span>
        <button aria-label="메뉴 닫기" onClick={onClose}>
          <X className="h-6 w-6" />
        </button>
      </div>

      <nav className="container-px flex flex-1 flex-col justify-center gap-8 py-10">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="text-2xl font-semibold"
          >
            {item.label}
          </a>
        ))}

        <a
          href="/design"
          onClick={onClose}
          className={buttonVariants({ size: "lg", className: "mt-4 w-full" })}
        >
          AI 디자인 시작하기
        </a>

        <a
          href="/login"
          onClick={onClose}
          className="text-center text-sm font-medium text-muted-foreground"
        >
          로그인
        </a>
      </nav>
    </div>
  );
}
