"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";

const NAV_ITEMS = [
  { label: "서비스", href: "/#services" },
  { label: "프로세스", href: "/#process" },
  { label: "포트폴리오", href: "/#portfolio" },
  { label: "AI 디자인", href: "/design" },
  { label: "GBRICK Coffee", href: "/#gbrick" },
];

/**
 * 홈페이지 상단 헤더. 모바일 우선 — 데스크톱은 가로 메뉴, 모바일은 햄버거.
 */
export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="container-px mx-auto flex h-16 max-w-6xl items-center justify-between">
        <a href="/" className="text-lg font-bold tracking-tight">
          DesignFOBEE
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            로그인
          </a>
          <a href="/design" className={buttonVariants({ size: "sm" })}>
            AI 디자인 시작하기
          </a>
        </div>

        <button
          aria-label="메뉴 열기"
          className="md:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <MobileNav open={open} onClose={() => setOpen(false)} items={NAV_ITEMS} />
    </header>
  );
}
