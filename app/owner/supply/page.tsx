import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공급/발주 — GBRICK Coffee 점주 포탈",
};

const PLANNED = [
  {
    icon: "💰",
    title: "물품 공급단가표",
    desc: "본사에서 가맹점에 공급하는 원부재료·소모품의 단가표입니다. 변경 시 점주 포탈에서 바로 확인할 수 있도록 준비합니다.",
  },
  {
    icon: "🛒",
    title: "발주 시스템",
    desc: "필요한 물품을 본사에 직접 발주할 수 있습니다. 발주 이력, 처리 현황, 예상 입고일을 확인할 수 있습니다.",
  },
];

export default function OwnerSupplyPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-[#1B1815]">공급 / 발주</h1>
      <p className="mb-8 text-sm text-[#6f6555]">
        물품 공급단가와 발주 시스템입니다. 현재 준비 중입니다.
      </p>

      <div className="space-y-4">
        {PLANNED.map((item) => (
          <div
            key={item.title}
            className="flex gap-4 rounded-xl border border-dashed border-[#E2DBD0] bg-white/60 p-5 opacity-70"
          >
            <span className="text-2xl" aria-hidden>
              {item.icon}
            </span>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1B1815]">{item.title}</h2>
                <span className="rounded bg-[#E2DBD0] px-2 py-0.5 text-[10px] font-semibold text-[#6f6555]">
                  준비 중
                </span>
              </div>
              <p className="text-sm text-[#6f6555]">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 rounded-lg border border-[#E2DBD0] bg-white/60 p-4 text-sm text-[#6f6555]">
        발주 시스템은 본사 ERP 연동이 필요합니다. 연동 준비가 완료되면 자동으로 열립니다.
      </p>
    </div>
  );
}
