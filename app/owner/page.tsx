import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드 — GBRICK Coffee 점주 포탈",
};

const TOOLS = [
  {
    href: "/owner/hr",
    icon: "📋",
    title: "인사 / 근무",
    items: ["근로계약서", "대타 기록지", "오픈/마감 체크리스트", "위생교육 기록부"],
    status: "active" as const,
  },
  {
    href: "/owner/docs",
    icon: "📄",
    title: "계약 / 법무",
    items: ["정보공개서(FDD)", "가맹 계약서", "가맹계약 전 체크리스트"],
    status: "soon" as const,
  },
  {
    href: "/owner/notices",
    icon: "📢",
    title: "공지 / 교육",
    items: ["본사 공지사항", "운영 매뉴얼", "QSC 점검표"],
    status: "soon" as const,
  },
  {
    href: "/owner/supply",
    icon: "🛒",
    title: "공급 / 발주",
    items: ["물품 공급단가표", "발주 시스템"],
    status: "soon" as const,
  },
];

export default function OwnerDashboard() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-[#1B1815]">점주 포탈</h1>
      <p className="mb-8 text-sm text-[#6f6555]">
        매장 운영에 필요한 문서와 시스템을 모았습니다.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => {
          const soon = tool.status === "soon";
          const Card = (
            <div
              className={`rounded-xl border p-5 transition-all ${
                soon
                  ? "border-[#E2DBD0] bg-white/60 opacity-60"
                  : "border-[#E2DBD0] bg-white shadow-lift hover:shadow-deep hover:-translate-y-0.5 cursor-pointer"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <span className="text-2xl" aria-hidden>
                  {tool.icon}
                </span>
                {soon && (
                  <span className="rounded bg-[#E2DBD0] px-2 py-0.5 text-[10px] font-semibold text-[#6f6555]">
                    준비 중
                  </span>
                )}
              </div>
              <h2 className="mb-2 text-base font-bold text-[#1B1815]">{tool.title}</h2>
              <ul className="space-y-0.5">
                {tool.items.map((item) => (
                  <li key={item} className="text-sm text-[#6f6555]">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          );

          return soon ? (
            <div key={tool.href}>{Card}</div>
          ) : (
            <a key={tool.href} href={tool.href}>
              {Card}
            </a>
          );
        })}
      </div>

      <p className="mt-10 text-xs text-[#a49a88]">
        문의: 지브릭커피 본사 &nbsp;|&nbsp; 기능 추가 요청은 본사로 연락주세요.
      </p>
    </div>
  );
}
