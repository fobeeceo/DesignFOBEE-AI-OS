"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";

const NAV_ITEMS = [
  { label: "회사소개", href: "/about" },
  { label: "서비스", href: "/#services" },
  { label: "프로세스", href: "/#process" },
  { label: "포트폴리오", href: "/#portfolio" },
  { label: "AI 디자인", href: "/design" },
  { label: "GBRICK Coffee", href: "/#gbrick" },
  { label: "가맹상담", href: "/franchise" },
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

        <nav className="hidden items-center gap-6 lg:flex">
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

        <div className="hidden items-center gap-3 lg:flex">
          <a href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            로그인
          </a>
          <a href="/design" className={buttonVariants({ variant: "outline", size: "sm" })}>
            AI 디자인
          </a>
          <a href="/franchise#consult" className={buttonVariants({ size: "sm" })}>
            가맹상담 신청
          </a>
        </div>

        <button
          aria-label="메뉴 열기"
          // -m-2 p-2로 아이콘 크기는 그대로 두고 터치 영역만 24px → 40px로 넓힌다
          // (모바일에서 햄버거 버튼이 눌리지 않는 문제 방지).
          className="-m-2 p-2 lg:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <MobileNav open={open} onClose={() => setOpen(false)} items={NAV_ITEMS} />
    </header>
  );
}
