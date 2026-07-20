"use client";

import { usePathname } from "next/navigation";
import { HQ_MENU } from "@/lib/hq/erpSnapshot";

/**
 * AI Headquarters 공통 셸 — 좌측 8메뉴 사이드바 + 상단바.
 * 기존 앱 테마(shadcn 토큰) 사용. 로그인 후 진입(홈 헤더 링크).
 */
export function HqShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isActive = (key: string) => path === (key ? `/hq/${key}` : "/hq");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="container-px mx-auto flex h-14 max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight">GBRICK AI Headquarters</span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
              지브릭커피 본점
            </span>
          </div>
          <a href="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
            ← 홈으로
          </a>
        </div>
      </header>

      <div className="container-px mx-auto flex max-w-7xl gap-6 py-6">
        <aside className="hidden w-48 shrink-0 sm:block">
          <nav className="sticky top-20 flex flex-col gap-1">
            {HQ_MENU.map((m) => (
              <a
                key={m.key}
                href={m.key ? `/hq/${m.key}` : "/hq"}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(m.key)
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span aria-hidden>{m.icon}</span>
                {m.label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
