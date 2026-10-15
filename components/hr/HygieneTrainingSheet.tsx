"use client";

import { useState } from "react";

interface TrainingRow {
  id: number;
  name: string;
  date: string;
  institution: string;
  type: string;
  hours: string;
  note: string;
}

const TRAINING_TYPES = [
  "신규 위생교육",
  "영업자 정기교육",
  "종업원 위생교육",
  "식품위생 보수교육",
  "HACCP 교육",
  "직무 교육",
  "기타",
];

function emptyRow(id: number): TrainingRow {
  return { id, name: "", date: "", institution: "", type: "", hours: "", note: "" };
}

export function HygieneTrainingSheet() {
  const [storeName, setStoreName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [rows, setRows] = useState<TrainingRow[]>(() =>
    Array.from({ length: 8 }, (_, i) => emptyRow(i + 1))
  );

  function updateRow(id: number, field: keyof TrainingRow, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(prev.length + 1)]);
  }

  function removeRow(id: number) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  // Print: fill to at least 12 rows
  const printRows = rows.length < 12 ? [...rows, ...Array.from({ length: 12 - rows.length }, (_, i) => emptyRow(rows.length + i + 1))] : rows;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm 15mm; }
        }
      `}</style>

      <div className="mb-4 rounded-lg border border-[#E2DBD0] bg-[#FDF8F3] p-3 text-sm text-[#6f6555] print:hidden">
        식품위생법 제41조에 따라 영업자 및 종업원의 위생교육 이수 기록을 관리하세요.
        작성 후 인쇄해 서명하고 2년간 보관합니다.
      </div>

      {/* 헤더 */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-[#6f6555] print:text-black">매장명</label>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="예: GBRICK 강남점"
            className="w-full rounded border border-[#E2DBD0] px-2 py-1.5 text-sm print:border-black"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#6f6555] print:text-black">관리 연도</label>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2025"
            className="w-full rounded border border-[#E2DBD0] px-2 py-1.5 text-sm print:border-black"
          />
        </div>
      </div>

      {/* 화면 테이블 */}
      <div className="overflow-x-auto print:hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#8C4A32] text-white">
              <th className="border border-[#8C4A32] px-2 py-2 text-left">성명</th>
              <th className="border border-[#8C4A32] px-2 py-2 text-left">교육일</th>
              <th className="border border-[#8C4A32] px-2 py-2 text-left">교육기관</th>
              <th className="border border-[#8C4A32] px-2 py-2 text-left">교육종류</th>
              <th className="border border-[#8C4A32] px-2 py-2 text-center">시간</th>
              <th className="border border-[#8C4A32] px-2 py-2 text-left">비고</th>
              <th className="border border-[#8C4A32] px-1 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-[#FAF7F4]"}>
                <td className="border border-[#E2DBD0] px-1 py-1">
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(row.id, "name", e.target.value)}
                    className="w-full bg-transparent px-1 text-sm"
                  />
                </td>
                <td className="border border-[#E2DBD0] px-1 py-1">
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(row.id, "date", e.target.value)}
                    className="w-full bg-transparent text-sm"
                  />
                </td>
                <td className="border border-[#E2DBD0] px-1 py-1">
                  <input
                    value={row.institution}
                    onChange={(e) => updateRow(row.id, "institution", e.target.value)}
                    className="w-full bg-transparent px-1 text-sm"
                    placeholder="예: 한국식품안전관리원"
                  />
                </td>
                <td className="border border-[#E2DBD0] px-1 py-1">
                  <select
                    value={row.type}
                    onChange={(e) => updateRow(row.id, "type", e.target.value)}
                    className="w-full bg-transparent text-sm"
                  >
                    <option value="">선택</option>
                    {TRAINING_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="border border-[#E2DBD0] px-1 py-1 text-center">
                  <input
                    value={row.hours}
                    onChange={(e) => updateRow(row.id, "hours", e.target.value)}
                    className="w-12 bg-transparent text-center text-sm"
                    placeholder="h"
                  />
                </td>
                <td className="border border-[#E2DBD0] px-1 py-1">
                  <input
                    value={row.note}
                    onChange={(e) => updateRow(row.id, "note", e.target.value)}
                    className="w-full bg-transparent px-1 text-sm"
                  />
                </td>
                <td className="border border-[#E2DBD0] px-1 py-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-[#aaa] hover:text-red-500"
                    aria-label="행 삭제"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 인쇄용 테이블 */}
      <div className="hidden print:block">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr style={{ background: "#000", color: "#fff" }}>
              <th className="border border-black px-1.5 py-1.5 text-left w-16">성명</th>
              <th className="border border-black px-1.5 py-1.5 text-left w-20">교육일</th>
              <th className="border border-black px-1.5 py-1.5 text-left">교육기관</th>
              <th className="border border-black px-1.5 py-1.5 text-left w-28">교육종류</th>
              <th className="border border-black px-1.5 py-1.5 text-center w-10">시간</th>
              <th className="border border-black px-1.5 py-1.5 text-left w-16">서명</th>
              <th className="border border-black px-1.5 py-1.5 text-left">비고</th>
            </tr>
          </thead>
          <tbody>
            {printRows.map((row, idx) => (
              <tr key={idx} style={{ height: "28px" }}>
                <td className="border border-black px-1.5">{row.name}</td>
                <td className="border border-black px-1.5">{row.date}</td>
                <td className="border border-black px-1.5">{row.institution}</td>
                <td className="border border-black px-1.5">{row.type}</td>
                <td className="border border-black px-1.5 text-center">{row.hours}</td>
                <td className="border border-black px-1.5" />
                <td className="border border-black px-1.5">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 화면 버튼 */}
      <div className="mt-4 flex gap-2 print:hidden">
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border border-[#8C4A32] px-4 py-2 text-sm font-semibold text-[#8C4A32] hover:bg-[#FDF0EA]"
        >
          + 행 추가
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto rounded-lg bg-[#8C4A32] px-5 py-2 text-sm font-semibold text-white hover:bg-[#7a3f2a]"
        >
          인쇄 / PDF 저장
        </button>
      </div>

      {/* 확인란 */}
      <div className="mt-6 grid grid-cols-2 gap-6 text-sm print:mt-8">
        <div>
          <p className="mb-1 font-semibold print:text-xs">관리자 확인</p>
          <div className="flex items-center gap-4">
            <span className="print:text-xs">서명</span>
            <span className="flex-1 border-b border-[#E2DBD0] print:border-black" />
          </div>
        </div>
        <div>
          <p className="mb-1 font-semibold print:text-xs">작성일</p>
          <div className="flex items-center gap-4">
            <span className="flex-1 border-b border-[#E2DBD0] print:border-black" />
          </div>
        </div>
      </div>

      <p className="hidden print:block mt-4 text-[10px] text-gray-500">
        GBRICK Coffee · 직원 위생교육 이수 기록부 · 식품위생법 제41조 · 2년간 보관 의무
      </p>
    </>
  );
}
