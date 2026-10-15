"use client";

import { useState } from "react";

interface CheckItem {
  id: string;
  label: string;
}

const OPEN_ITEMS: CheckItem[] = [
  { id: "o1", label: "매장 내·외부 청결 상태 확인" },
  { id: "o2", label: "냉장·냉동고 온도 확인 (냉장 0~10℃ / 냉동 -18℃ 이하)" },
  { id: "o3", label: "음료 재료·소모품 재고 확인 및 발주" },
  { id: "o4", label: "POS 시스템·카드 단말기 정상 작동 확인" },
  { id: "o5", label: "커피머신·그라인더 예열 및 청소 상태 확인" },
  { id: "o6", label: "제빙기 위생 상태 확인" },
  { id: "o7", label: "개인위생 확인 (위생모·위생복·손 소독)" },
  { id: "o8", label: "당일 유통기한 임박·초과 원재료 확인 및 폐기" },
  { id: "o9", label: "간판·조명 점등 확인" },
  { id: "o10", label: "방역·소독 기록 확인" },
];

const CLOSE_ITEMS: CheckItem[] = [
  { id: "c1", label: "잔여 식재료 밀봉·냉장 보관 처리" },
  { id: "c2", label: "커피머신·그라인더 세척 및 정기 청소" },
  { id: "c3", label: "제빙기·냉장고 문 잠금 상태 확인" },
  { id: "c4", label: "싱크대·조리대 세척 및 소독" },
  { id: "c5", label: "쓰레기 분리배출 및 음식물 쓰레기 처리" },
  { id: "c6", label: "바닥 청소 (걸레질 또는 청소기)" },
  { id: "c7", label: "가스 밸브 잠금 확인" },
  { id: "c8", label: "전원 차단 (커피머신 제외 설정에 따라)" },
  { id: "c9", label: "POS 마감 정산 및 현금 보관" },
  { id: "c10", label: "출입문·창문 시건 및 CCTV 작동 확인" },
];

export function OpenCloseChecklist() {
  const [storeName, setStoreName] = useState("");
  const [date, setDate] = useState("");
  const [manager, setManager] = useState("");
  const [openChecked, setOpenChecked] = useState<Set<string>>(new Set());
  const [closeChecked, setCloseChecked] = useState<Set<string>>(new Set());
  const [openMemo, setOpenMemo] = useState("");
  const [closeMemo, setCloseMemo] = useState("");

  function toggleOpen(id: string) {
    setOpenChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleClose(id: string) {
    setCloseChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm 15mm; }
        }
      `}</style>

      {/* 화면 안내 */}
      <div className="mb-4 rounded-lg border border-[#E2DBD0] bg-[#FDF8F3] p-3 text-sm text-[#6f6555] print:hidden">
        매장명·날짜·담당자를 입력하고 <strong>인쇄</strong>하거나, 체크 후 인쇄해 서명 후 보관하세요.
      </div>

      {/* 헤더 정보 */}
      <div className="mb-4 grid grid-cols-3 gap-3 print:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-[#6f6555] print:text-black">매장명</label>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="예: GBRICK 강남점"
            className="w-full rounded border border-[#E2DBD0] px-2 py-1.5 text-sm print:border-black print:px-1"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#6f6555] print:text-black">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border border-[#E2DBD0] px-2 py-1.5 text-sm print:border-black print:px-1"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#6f6555] print:text-black">담당자</label>
          <input
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            placeholder="이름"
            className="w-full rounded border border-[#E2DBD0] px-2 py-1.5 text-sm print:border-black print:px-1"
          />
        </div>
      </div>

      <div className="grid gap-6 print:gap-4 md:grid-cols-2">
        {/* 오픈 체크리스트 */}
        <section>
          <h2 className="mb-3 rounded bg-[#8C4A32] px-3 py-2 text-sm font-bold text-white print:bg-black">
            오픈 체크리스트
          </h2>
          <ul className="space-y-1.5">
            {OPEN_ITEMS.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => toggleOpen(item.id)}
                  aria-pressed={openChecked.has(item.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border border-[#8C4A32] print:hidden"
                  style={{
                    background: openChecked.has(item.id) ? "#8C4A32" : "white",
                  }}
                />
                {/* 인쇄용 빈 체크박스 */}
                <span className="hidden print:inline-block mt-0.5 h-4 w-4 shrink-0 rounded border border-black" />
                <span className={openChecked.has(item.id) ? "line-through text-[#aaa] print:no-underline print:text-black" : ""}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <label className="mb-1 block text-xs text-[#6f6555] print:text-black">특이사항</label>
            <textarea
              value={openMemo}
              onChange={(e) => setOpenMemo(e.target.value)}
              rows={3}
              placeholder="오픈 시 특이사항을 기록하세요"
              className="w-full resize-none rounded border border-[#E2DBD0] px-2 py-1.5 text-sm print:border-black"
            />
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm print:mt-4">
            <span className="text-[#6f6555] print:text-black">오픈 확인 서명</span>
            <span className="flex-1 border-b border-[#E2DBD0] print:border-black" />
          </div>
        </section>

        {/* 마감 체크리스트 */}
        <section>
          <h2 className="mb-3 rounded bg-[#3B4A5A] px-3 py-2 text-sm font-bold text-white print:bg-black">
            마감 체크리스트
          </h2>
          <ul className="space-y-1.5">
            {CLOSE_ITEMS.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => toggleClose(item.id)}
                  aria-pressed={closeChecked.has(item.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border border-[#3B4A5A] print:hidden"
                  style={{
                    background: closeChecked.has(item.id) ? "#3B4A5A" : "white",
                  }}
                />
                <span className="hidden print:inline-block mt-0.5 h-4 w-4 shrink-0 rounded border border-black" />
                <span className={closeChecked.has(item.id) ? "line-through text-[#aaa] print:no-underline print:text-black" : ""}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <label className="mb-1 block text-xs text-[#6f6555] print:text-black">특이사항</label>
            <textarea
              value={closeMemo}
              onChange={(e) => setCloseMemo(e.target.value)}
              rows={3}
              placeholder="마감 시 특이사항을 기록하세요"
              className="w-full resize-none rounded border border-[#E2DBD0] px-2 py-1.5 text-sm print:border-black"
            />
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm print:mt-4">
            <span className="text-[#6f6555] print:text-black">마감 확인 서명</span>
            <span className="flex-1 border-b border-[#E2DBD0] print:border-black" />
          </div>
        </section>
      </div>

      {/* 인쇄 버튼 */}
      <div className="mt-6 flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-[#8C4A32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7a3f2a]"
        >
          인쇄 / PDF 저장
        </button>
      </div>

      {/* 인쇄 하단 */}
      <p className="hidden print:block mt-6 border-t border-black pt-3 text-[10px] text-gray-500">
        GBRICK Coffee · 매장 오픈·마감 체크리스트 · 작성 후 서명하여 1개월간 보관 (식품위생법 제88조)
      </p>
    </>
  );
}
