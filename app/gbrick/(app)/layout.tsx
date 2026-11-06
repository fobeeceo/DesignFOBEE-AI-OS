"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { key: "home", label: "홈", icon: "🏠", href: "/gbrick" },
  { key: "order", label: "주문", icon: "☕", href: "/gbrick/stores" },
  { key: "history", label: "내역", icon: "📋", href: "/gbrick/history" },
  { key: "mypage", label: "마이", icon: "👤", href: "/gbrick/mypage" },
];

export default function GbrickAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/gbrick") return false;
    return pathname.startsWith(href);
  }

  return (
    <>
      <div className="pb-16">{children}</div>
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white border-t border-stone-200 z-50"
        style={{ maxWidth: 480, paddingBottom: "env(safe-area-inset-bottom)", fontFamily: "Pretendard, sans-serif" }}
      >
        <div className="flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className="flex-1 flex flex-col items-center py-2.5 gap-0.5"
                style={{ color: active ? "#C8873A" : "#9CA3AF" }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
