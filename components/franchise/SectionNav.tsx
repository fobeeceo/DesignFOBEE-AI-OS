/**
 * 섹션 바로가기 — 긴 랜딩에서 보고 싶은 곳(메뉴·비용·상담)으로 바로 가게 한다(2026-10-15 대표 지시).
 * 헤더(h-16) 바로 아래에 붙는다. 모바일에서는 옆으로 밀어서 본다.
 * 서버 컴포넌트·순수 앵커라 JS가 실패해도 작동한다.
 */
const LINKS = [
  { href: "#menu", label: "메뉴" },
  { href: "#advantages", label: "왜 GBRICK" },
  { href: "#stores", label: "매장" },
  { href: "#process", label: "창업 절차" },
  { href: "#cost", label: "창업 비용" },
  { href: "#faq", label: "FAQ" },
  { href: "#consult", label: "상담 신청" },
];

export function SectionNav() {
  return (
    <nav
      aria-label="가맹 안내 바로가기"
      className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur"
    >
      <ul className="container-px mx-auto flex max-w-6xl gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
        {LINKS.map((link) => (
          <li key={link.href} className="shrink-0">
            <a
              href={link.href}
              className={
                link.href === "#consult"
                  ? "inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  : "inline-block rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent"
              }
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
