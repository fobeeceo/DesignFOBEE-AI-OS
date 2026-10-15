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
  { label: "자서전", href: "/memoir" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="container-px mx-auto flex h-16 max-w-6xl items-center justify-between">
        <a href="/" className="text-lg font-bold tracking-tight">
          DesignFOBEE
        </a>

        <nav className="hidden items-center gap-4 xl:flex">
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

        <div className="hidden items-center gap-2 xl:flex">
          <a href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            로그인
          </a>
          <a
            href="/owner"
            className="rounded-full border border-[#8C4A32]/30 bg-[#8C4A32]/5 px-3 py-1 text-xs font-semibold text-[#8C4A32] transition-colors hover:bg-[#8C4A32]/10"
          >
            점주 포탈
          </a>
          <a href="/franchise#consult" className={buttonVariants({ size: "sm" })}>
            가맹상담 신청
          </a>
        </div>

        <button
          aria-label="메뉴 열기"
          className="-m-2 p-2 xl:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <MobileNav open={open} onClose={() => setOpen(false)} items={NAV_ITEMS} />
    </header>
  );
}