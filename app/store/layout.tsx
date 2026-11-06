"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/store/login") {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  const navItems = [
    { href: "/store/orders", label: "주문", icon: "🛒" },
    { href: "/store/menus", label: "품절관리", icon: "⚠️" },
    { href: "/store/checklists", label: "체크리스트", icon: "✅" },
    { href: "/store/notices", label: "공지", icon: "📢" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {children}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex z-50"
        style={{ fontFamily: "Pretendard, sans-serif" }}>
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center py-2 gap-0.5"
              style={{ color: active ? "#C8873A" : "#9CA3AF" }}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
