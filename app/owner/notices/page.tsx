import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공지/교육 — GBRICK Coffee 점주 포탈",
};

const PLANNED = [
  {
    icon: "📢",
    title: "본사 공지사항",
    desc: "본사에서 가맹점주에게 전달하는 운영 공지, 메뉴 변경, 행사 안내 등을 확인합니다.",
  },
  {
    icon: "📋",
    title: "운영 매뉴얼",
    desc: "GBRICK Coffee 표준 운영 절차(SOP)입니다. 음료 레시피, 위생 기준, 고객 응대 가이드, 매장 시설 관리 방법을 포함합니다.",
  },
  {
    icon: "🎓",
    title: "교육 자료",
    desc: "바리스타 기본 교육, 신규 메뉴 교육, 위생 교육 영상 및 자료를 제공합니다. 본사 교육 이수 현황도 확인할 수 있습니다.",
  },
  {
    icon: "📊",
    title: "QSC 점검표",
    desc: "품질(Quality)·서비스(Service)·청결(Cleanliness) 자가 점검표입니다. 정기 점검 전 미리 확인하세요.",
  },
];

export default function OwnerNoticesPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-[#1B1815]">공지 / 교육</h1>
      <p className="mb-8 text-sm text-[#6f6555]">
        본사 공지 및 운영 교육 자료입니다. 현재 준비 중입니다.
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
        운영 매뉴얼 및 교육 시스템은 본사 ERP 연동 후 자동으로 열립니다. 긴급 공지는 본사에 직접 문의하세요.
      </p>
    </div>
  );
}
