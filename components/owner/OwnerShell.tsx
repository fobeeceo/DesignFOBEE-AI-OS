"use client";

import { usePathname } from "next/navigation";

export const OWNER_MENU = [
  {
    key: "",
    label: "대시보드",
    icon: "🏠",
    status: "active" as const,
  },
  {
    key: "hr",
    label: "인사 / 근무",
    icon: "📋",
    status: "active" as const,
    desc: "근로계약서 · 대타 · 체크리스트",
  },
  {
    key: "docs",
    label: "계약 / 법무",
    icon: "📄",
    status: "soon" as const,
    desc: "정보공개서 · 가맹 계약서",
  },
  {
    key: "notices",
    label: "공지 / 교육",
    icon: "📢",
    status: "soon" as const,
    desc: "본사 공지 · 운영 매뉴얼",
  },
  {
    key: "supply",
    label: "공급 / 발주",
    icon: "🛒",
    status: "soon" as const,
    desc: "물품 공급단가표 · 발주 시스템",
  },
] as const;

export function OwnerShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  function isActive(key: string) {
    const base = key ? `/owner/${key}` : "/owner";
    return path === base || path.startsWith(base + "/");
  }

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#1B1815]">
      {/* 상단바 */}
      <header className="print:hidden sticky top-0 z-40 border-b border-[#E2DBD0] bg-[#FAF8F5]/90 backdrop-blur">
        <div className="container-px mx-auto flex h-14 max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold tracking-tight text-[#1B1815]">
              GBRICK Coffee
            </span>
            <span className="rounded-full bg-[#8C4A32]/10 px-2 py-0.5 text-[10px] font-semibold text-[#8C4A32]">
              점주 포탈
            </span>
          </div>
          <a
            href="/"
            className="text-xs font-medium text-[#6f6555] hover:text-[#1B1815]"
          >
            ← 메인 사이트
          </a>
        </div>
      </header>

      <div className="container-px mx-auto flex max-w-7xl gap-6 py-6">
        {/* 사이드바 */}
        <aside className="print:hidden hidden w-52 shrink-0 sm:block">
          <nav className="sticky top-20 flex flex-col gap-1">
            {OWNER_MENU.map((m) => {
              const href = m.key ? `/owner/${m.key}` : "/owner";
              const active = isActive(m.key);
              const soon = m.status === "soon";

              return (
                <a
                  key={m.key}
                  href={soon ? undefined : href}
                  aria-disabled={soon}
                  className={`flex flex-col rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    soon
                      ? "cursor-default opacity-50"
                      : active
                      ? "bg-[#8C4A32] text-white font-semibold"
                      : "text-[#6f6555] hover:bg-[#EDE8E0] hover:text-[#1B1815]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{m.icon}</span>
                    <span>{m.label}</span>
                    {soon && (
                      <span className="ml-auto rounded bg-[#E2DBD0] px-1.5 py-0.5 text-[9px] font-medium text-[#6f6555]">
                        준비 중
                      </span>
                    )}
                  </span>
                  {"desc" in m && m.desc && (
                    <span className="mt-0.5 pl-6 text-[10px] opacity-70">{m.desc}</span>
                  )}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
