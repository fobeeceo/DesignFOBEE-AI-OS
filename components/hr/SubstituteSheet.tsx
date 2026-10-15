"use client";

import { useState } from "react";

interface SubRow {
  date: string;
  originalWorker: string;
  substitute: string;
  startTime: string;
  endTime: string;
  reason: string;
}

function emptyRow(): SubRow {
  return { date: "", originalWorker: "", substitute: "", startTime: "", endTime: "", reason: "" };
}

const today = new Date().toISOString().split("T")[0];

const cellInput =
  "w-full border-0 bg-transparent px-1 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/40 print:focus:ring-0";

export function SubstituteSheet() {
  const [storeName, setStoreName] = useState("지브릭커피");
  const [sheetDate, setSheetDate] = useState(today);
  const [rows, setRows] = useState<SubRow[]>([emptyRow(), emptyRow(), emptyRow()]);

  function updateRow(i: number, field: keyof SubRow, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(i: number) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  const [signY, signM, signD] = sheetDate.split("-");

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 15mm 12mm; }
        }
      `}</style>

      {/* ── 화면 전용 ── */}
      <div className="print:hidden">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">대타 근무 기록지</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              인쇄 / PDF 저장
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">매장명</label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">작성일</label>
            <input
              type="date"
              value={sheetDate}
              onChange={(e) => setSheetDate(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">날짜</th>
                <th className="px-3 py-2 text-left font-medium">원 담당자</th>
                <th className="px-3 py-2 text-left font-medium">대타자</th>
                <th className="px-3 py-2 text-left font-medium">출근</th>
                <th className="px-3 py-2 text-left font-medium">퇴근</th>
                <th className="px-3 py-2 text-left font-medium">사유</th>
                <th className="w-8 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(i, "date", e.target.value)}
                      className="rounded border border-border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={row.originalWorker}
                      onChange={(e) => updateRow(i, "originalWorker", e.target.value)}
                      className="rounded border border-border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="홍길동"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={row.substitute}
                      onChange={(e) => updateRow(i, "substitute", e.target.value)}
                      className="rounded border border-border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="김철수"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="time"
                      value={row.startTime}
                      onChange={(e) => updateRow(i, "startTime", e.target.value)}
                      className="rounded border border-border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="time"
                      value={row.endTime}
                      onChange={(e) => updateRow(i, "endTime", e.target.value)}
                      className="rounded border border-border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={row.reason}
                      onChange={(e) => updateRow(i, "reason", e.target.value)}
                      className="rounded border border-border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 w-full"
                      placeholder="개인 사정 등"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="행 삭제"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="mt-2 rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          + 행 추가
        </button>
      </div>

      {/* ── 인쇄 전용 레이아웃 ── */}
      <div className="hidden print:block font-sans">
        {/* 헤더 */}
        <div className="mb-4 flex items-end justify-between border-b-2 border-gray-800 pb-2">
          <div>
            <h1 className="text-[18px] font-bold tracking-[0.15em]">대 타 근 무 기 록 지</h1>
            <p className="text-[11px] text-gray-600">{storeName}</p>
          </div>
          <p className="text-[11px] text-gray-600">
            작성일: {signY}년 {signM}월 {signD}일
          </p>
        </div>

        {/* 기록 테이블 */}
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold w-8">번호</th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold w-24">날짜</th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">원 담당자</th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">대 타 자</th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold w-20">출근시간</th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold w-20">퇴근시간</th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">사유</th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold w-20">확인 (서명)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="border border-gray-400 px-2 py-2 text-center text-gray-500">{i + 1}</td>
                <td className="border border-gray-400 px-2 py-2 text-center">
                  {row.date ? row.date.replace(/-/g, ".") : ""}
                </td>
                <td className="border border-gray-400 px-2 py-2 text-center">{row.originalWorker}</td>
                <td className="border border-gray-400 px-2 py-2 text-center">{row.substitute}</td>
                <td className="border border-gray-400 px-2 py-2 text-center">{row.startTime}</td>
                <td className="border border-gray-400 px-2 py-2 text-center">{row.endTime}</td>
                <td className="border border-gray-400 px-2 py-2">{row.reason}</td>
                <td className="border border-gray-400 px-2 py-2" />
              </tr>
            ))}
            {/* 빈 행 여백 */}
            {Array.from({ length: Math.max(0, 15 - rows.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-gray-400 px-2 py-2 text-center text-gray-300">{rows.length + i + 1}</td>
                <td className="border border-gray-400 px-2 py-2" />
                <td className="border border-gray-400 px-2 py-2" />
                <td className="border border-gray-400 px-2 py-2" />
                <td className="border border-gray-400 px-2 py-2" />
                <td className="border border-gray-400 px-2 py-2" />
                <td className="border border-gray-400 px-2 py-2" />
                <td className="border border-gray-400 px-2 py-2" />
              </tr>
            ))}
          </tbody>
        </table>

        {/* 서명 */}
        <div className="mt-6 flex justify-end gap-12 text-[11px]">
          <div className="text-center">
            <p className="mb-6">관리자 확인</p>
            <p className="border-t border-gray-800 pt-1 text-gray-500">(서명/인)</p>
          </div>
        </div>

        <p className="mt-4 text-[9.5px] text-gray-500">
          ※ 본 기록지는 대타 근무 발생 시마다 작성하여 매장에 보관합니다.
          임금 정산 시 참고 자료로 활용하시기 바랍니다.
        </p>
      </div>
    </>
  );
}
