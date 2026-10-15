"use client";

import { useState } from "react";
import { ContractForm } from "@/components/hr/ContractForm";
import { SubstituteSheet } from "@/components/hr/SubstituteSheet";
import { OpenCloseChecklist } from "@/components/hr/OpenCloseChecklist";
import { HygieneTrainingSheet } from "@/components/hr/HygieneTrainingSheet";

type Tab = "contract" | "substitute" | "checklist" | "hygiene";

const TABS: { key: Tab; label: string; desc: string }[] = [
  { key: "contract", label: "근로계약서", desc: "작성 후 인쇄해 서명 보관" },
  { key: "substitute", label: "대타 기록지", desc: "대타 발생 시 작성 후 인쇄" },
  { key: "checklist", label: "오픈/마감 체크리스트", desc: "매일 오픈·마감 시 작성" },
  { key: "hygiene", label: "위생교육 기록부", desc: "직원 위생교육 이수 기록" },
];

export default function OwnerHrPage() {
  const [tab, setTab] = useState<Tab>("contract");

  return (
    <div>
      {/* 탭 헤더 — 인쇄 시 숨김 */}
      <div className="print:hidden mb-6">
        <h1 className="mb-4 text-xl font-bold text-[#1B1815]">인사 / 근무</h1>
        <div className="flex flex-wrap gap-1 rounded-xl bg-[#EDE8E0] p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 min-w-[120px] rounded-lg px-3 py-2 text-sm transition-colors ${
                tab === t.key
                  ? "bg-white font-semibold text-[#1B1815] shadow-lift"
                  : "text-[#6f6555] hover:text-[#1B1815]"
              }`}
            >
              <span className="block">{t.label}</span>
              <span className="block text-[10px] font-normal opacity-70">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      {tab === "contract" && <ContractForm />}
      {tab === "substitute" && <SubstituteSheet />}
      {tab === "checklist" && <OpenCloseChecklist />}
      {tab === "hygiene" && <HygieneTrainingSheet />}
    </div>
  );
}
