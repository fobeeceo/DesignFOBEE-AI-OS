import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "계약/법무 — GBRICK Coffee 점주 포탈",
};

const PLANNED = [
  {
    icon: "📑",
    title: "정보공개서 (FDD)",
    desc: "가맹사업거래의 공정화에 관한 법률에 따라 본사가 예비 가맹점주에게 가맹계약 체결 14일 전 제공하는 공식 서류입니다. 공정거래위원회에 등록된 원본을 본사에서 직접 제공합니다.",
  },
  {
    icon: "📝",
    title: "가맹계약서",
    desc: "GBRICK Coffee 본사와 가맹점주 간의 가맹계약서입니다. 계약 전 충분히 검토하고 법률 전문가 자문을 권장합니다. 작성 후 쌍방 서명·날인하여 각 1부 보관합니다.",
  },
  {
    icon: "✅",
    title: "가맹계약 전 체크리스트",
    desc: "계약 서명 전 반드시 확인해야 할 항목 목록입니다. 정보공개서 수령 여부, 예상 창업비용 검토, 인근 기존 가맹점 현황, 계약기간·갱신 조건, 로열티·차액가맹금 조건 등을 점검합니다.",
  },
  {
    icon: "🏪",
    title: "영업신고증 갱신 안내",
    desc: "식품위생법에 따른 일반음식점·휴게음식점 영업신고증은 소재지 관할 구청에서 발급하며, 양수·이전·업종 변경 시 재신고가 필요합니다. 갱신 절차 및 첨부 서류를 안내합니다.",
  },
];

export default function OwnerDocsPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-[#1B1815]">계약 / 법무</h1>
      <p className="mb-8 text-sm text-[#6f6555]">
        가맹 계약 관련 문서 및 법적 체크 항목입니다. 현재 준비 중입니다.
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
        정보공개서·가맹계약서는 법적 효력이 있는 문서입니다. 본사 담당자에게 요청하거나 공정거래위원회
        가맹사업정보제공시스템(
        <span className="font-medium">https://franchise.ftc.go.kr</span>)에서 확인하세요.
      </p>
    </div>
  );
}
