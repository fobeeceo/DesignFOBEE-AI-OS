import Link from "next/link";
import { GBRICK_BRAND } from "@/lib/gbrick/constants";

export default function GbrickHome() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center px-6 pt-16 pb-10 text-white"
        style={{ background: "linear-gradient(160deg, #2C1A0E 0%, #4A2F14 100%)" }}
      >
        <div className="text-4xl font-bold tracking-widest mb-1">GBRICK</div>
        <div className="text-sm tracking-[0.3em] text-amber-300 mb-8">COFFEE</div>
        <p className="text-sm text-amber-100 text-center leading-relaxed mb-10">
          스페셜티 커피와 수제 음료<br />좋은 공간에서 좋은 에너지를
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/gbrick/(app)/stores"
            className="block w-full text-center py-3.5 rounded-xl font-semibold text-sm"
            style={{ background: "#C8873A", color: "#fff" }}
          >
            주문하기
          </Link>
          <Link
            href="/gbrick/(auth)/login"
            className="block w-full text-center py-3.5 rounded-xl font-semibold text-sm border border-amber-300 text-amber-200"
          >
            로그인 / 회원가입
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 py-8 flex flex-col gap-4">
        <h2 className="text-base font-bold text-stone-800">멤버십 혜택</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "☕", title: "포인트 적립", desc: "결제금액 3%" },
            { icon: "🎟️", title: "스탬프", desc: "10개 모으면 무료" },
            { icon: "🎁", title: "쿠폰", desc: "생일·이벤트 혜택" },
          ].map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white shadow-sm border border-stone-100"
            >
              <span className="text-2xl">{f.icon}</span>
              <span className="text-xs font-semibold text-stone-700">{f.title}</span>
              <span className="text-xs text-stone-400">{f.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Menu highlights */}
      <section className="px-5 pb-8 flex flex-col gap-3">
        <h2 className="text-base font-bold text-stone-800">시그니처 메뉴</h2>
        {[
          { name: "지브릭 라떼", price: "6,500원", tag: "시그니처" },
          { name: "수제 자몽티", price: "6,000원", tag: "수제" },
          { name: "수제 팥빙수", price: "9,000원", tag: "계절한정" },
        ].map((m) => (
          <div
            key={m.name}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-white shadow-sm border border-stone-100"
          >
            <div>
              <span className="text-sm font-semibold text-stone-800">{m.name}</span>
              <span
                className="ml-2 text-xs px-1.5 py-0.5 rounded-full text-white"
                style={{ background: "#C8873A" }}
              >
                {m.tag}
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: "#2C1A0E" }}>{m.price}</span>
          </div>
        ))}
      </section>

      {/* Bottom Nav */}
      <GbBottomNav active="home" />
    </main>
  );
}

function GbBottomNav({ active }: { active: string }) {
  const items = [
    { key: "home", label: "홈", icon: "🏠", href: "/gbrick" },
    { key: "order", label: "주문", icon: "☕", href: "/gbrick/(app)/stores" },
    { key: "history", label: "내역", icon: "📋", href: "/gbrick/(app)/history" },
    { key: "mypage", label: "마이", icon: "👤", href: "/gbrick/(app)/mypage" },
  ];
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-stone-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5"
          >
            <span className="text-xl">{item.icon}</span>
            <span
              className="text-xs"
              style={{ color: active === item.key ? "#C8873A" : "#9CA3AF" }}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
