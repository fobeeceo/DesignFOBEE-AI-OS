"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    key: "home",
    label: "홈",
    href: "/gbrick",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#2C1A0E" : "none"} stroke={active ? "#2C1A0E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    key: "order",
    label: "주문",
    href: "/gbrick/stores",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#2C1A0E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 010 8h-1"/>
        <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
  },
  {
    key: "gift",
    label: "선물하기",
    href: "/gbrick/gift",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#2C1A0E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
        <line x1="12" y1="22" x2="12" y2="7"/>
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
      </svg>
    ),
  },
  {
    key: "more",
    label: "더보기",
    href: "/gbrick/mypage",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#2C1A0E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
  },
];

export default function GbrickAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string, key: string) {
    if (key === "home") return pathname === "/gbrick";
    if (key === "more") return pathname.startsWith("/gbrick/mypage");
    return pathname.startsWith(href);
  }

  return (
    <>
      <div>{children}</div>
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white border-t border-stone-100 z-50 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]"
        style={{ maxWidth: 480, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex">
          {NAV.map((item) => {
            const active = isActive(item.href, item.key);
            return (
              <Link
                key={item.key}
                href={item.href}
                className="flex-1 flex flex-col items-center pt-2.5 pb-2 gap-1"
              >
                {item.icon(active)}
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: active ? "#2C1A0E" : "#9CA3AF" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
