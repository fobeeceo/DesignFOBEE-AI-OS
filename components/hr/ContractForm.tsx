"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  netHours,
  calcWeeklyAllowance,
  calcSeveranceEligibility,
  WORK_DAYS_KO,
  MIN_HOURLY_WAGE,
  type WorkDayKo,
} from "@/lib/hr/contractCalc";

interface ContractValues {
  storeName: string;
  employerName: string;
  businessAddress: string;
  empName: string;
  empBirth: string;
  empAddress: string;
  empPhone: string;
  contractType: "fixed" | "permanent" | "parttime";
  startDate: string;
  endDate: string;
  noEndDate: boolean;
  probation: boolean;
  probationDays: string;
  sameLocation: boolean;
  workLocation: string;
  jobDuty: string;
  startTime: string;
  endTime: string;
  breakMin: string;
  wageType: "hourly" | "monthly";
  wageAmount: string;
  weeklyAllowIncluded: boolean;
  payday: string;
  payMethod: string;
  insEmployment: boolean;
  insAccident: boolean;
  insPension: boolean;
  insHealth: boolean;
  signDate: string;
}

const today = new Date().toISOString().split("T")[0];

const DEFAULTS: ContractValues = {
  storeName: "지브릭커피",
  employerName: "",
  businessAddress: "",
  empName: "",
  empBirth: "",
  empAddress: "",
  empPhone: "",
  contractType: "fixed",
  startDate: "",
  endDate: "",
  noEndDate: false,
  probation: false,
  probationDays: "3",
  sameLocation: true,
  workLocation: "",
  jobDuty: "음료 제조 및 매장 운영 보조",
  startTime: "09:00",
  endTime: "18:00",
  breakMin: "60",
  wageType: "hourly",
  wageAmount: "",
  weeklyAllowIncluded: false,
  payday: "25",
  payMethod: "계좌이체",
  insEmployment: true,
  insAccident: true,
  insPension: false,
  insHealth: false,
  signDate: today,
};

const CONTRACT_TYPE_LABEL: Record<ContractValues["contractType"], string> = {
  fixed: "기간제 근로계약 (기간의 정함 있음)",
  permanent: "기간의 정함 없는 근로계약",
  parttime: "단시간 근로계약",
};

function fmtDate(iso: string) {
  if (!iso) return "____년 __월 __일";
  const [y, m, d] = iso.split("-");
  return `${y}년 ${m}월 ${d}일`;
}

function fmtKrw(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

const sectionHdr =
  "mt-6 border-b border-border pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export function ContractForm() {
  const { register, watch, reset } = useForm<ContractValues>({ defaultValues: DEFAULTS });
  const [workDays, setWorkDays] = useState<WorkDayKo[]>(["월", "화", "수", "목", "금"]);
  const [showPreview, setShowPreview] = useState(false);
  const v = watch();

  // 실시간 계산
  const dayHrs = netHours(v.startTime || "00:00", v.endTime || "00:00", Number(v.breakMin) || 0);
  const wkHrs = Math.round(dayHrs * workDays.length * 10) / 10;
  const hourly = Number(v.wageAmount) || 0;
  const isHourly = v.wageType === "hourly";
  const wkAllow = isHourly ? calcWeeklyAllowance(wkHrs, hourly) : null;
  const severance = calcSeveranceEligibility(wkHrs, v.startDate, v.noEndDate ? undefined : v.endDate);
  const belowMinWage = isHourly && hourly > 0 && hourly < MIN_HOURLY_WAGE;

  function toggleDay(day: WorkDayKo) {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  const workLocation = v.sameLocation ? v.businessAddress || "(사업장 주소와 동일)" : v.workLocation;
  const contractPeriod = v.noEndDate
    ? `${fmtDate(v.startDate)}부터 — 기간의 정함 없음`
    : `${fmtDate(v.startDate)} ~ ${fmtDate(v.endDate)}`;
  const signDateParts = v.signDate ? v.signDate.split("-") : ["____", "__", "__"];
  const [signY, signM, signD] = signDateParts;

  return (
    <>
      {/* 인쇄 시 @page A4 설정 — memoir의 A5 규칙을 덮어쓴다 */}
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm 15mm; }
        }
      `}</style>

      {/* ── 화면 전용 영역 ── */}
      <div className="print:hidden">
        {/* 상단 버튼 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">근로계약서 작성</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((p) => !p)}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              {showPreview ? "미리보기 닫기" : "미리보기"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              인쇄 / PDF 저장
            </button>
            <button
              type="button"
              onClick={() => { reset(DEFAULTS); setWorkDays(["월", "화", "수", "목", "금"]); }}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              초기화
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ── 입력 폼 ── */}
          <div className="min-w-0 flex-1 space-y-3">

            <p className={sectionHdr}>사업주 정보</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="상호 (매장명)">
                <input {...register("storeName")} className={inputCls} placeholder="지브릭커피 ○○점" />
              </Field>
              <Field label="대표자 성명">
                <input {...register("employerName")} className={inputCls} />
              </Field>
            </div>
            <Field label="사업장 소재지">
              <input {...register("businessAddress")} className={inputCls} />
            </Field>

            <p className={sectionHdr}>근로자 정보</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="성명">
                <input {...register("empName")} className={inputCls} />
              </Field>
              <Field label="생년월일">
                <input {...register("empBirth")} type="date" className={inputCls} />
              </Field>
            </div>
            <Field label="주소">
              <input {...register("empAddress")} className={inputCls} />
            </Field>
            <Field label="연락처">
              <input {...register("empPhone")} className={inputCls} placeholder="010-0000-0000" />
            </Field>

            <p className={sectionHdr}>계약 조건</p>
            <Field label="계약 유형">
              <select {...register("contractType")} className={inputCls}>
                <option value="fixed">기간제 (기간의 정함 있음)</option>
                <option value="permanent">기간의 정함 없음</option>
                <option value="parttime">단시간 근로계약</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="시작일">
                <input {...register("startDate")} type="date" className={inputCls} />
              </Field>
              <Field label="종료일">
                <input
                  {...register("endDate")}
                  type="date"
                  className={inputCls}
                  disabled={v.noEndDate}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("noEndDate")} className="rounded" />
              기간의 정함 없음 (종료일 없음)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("probation")} className="rounded" />
              수습 기간 적용
              {v.probation && (
                <span className="flex items-center gap-1">
                  <input
                    {...register("probationDays")}
                    className="w-14 rounded border border-border px-2 py-1 text-sm"
                  />
                  <span className="text-muted-foreground">개월</span>
                </span>
              )}
            </label>

            <p className={sectionHdr}>근무지 &amp; 업무</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("sameLocation")} className="rounded" />
              사업장 소재지와 동일
            </label>
            {!v.sameLocation && (
              <Field label="근무 장소">
                <input {...register("workLocation")} className={inputCls} />
              </Field>
            )}
            <Field label="업무 내용">
              <input {...register("jobDuty")} className={inputCls} />
            </Field>

            <p className={sectionHdr}>근로시간</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="출근 시간">
                <input {...register("startTime")} type="time" className={inputCls} />
              </Field>
              <Field label="퇴근 시간">
                <input {...register("endTime")} type="time" className={inputCls} />
              </Field>
              <Field label="휴게 (분)">
                <input {...register("breakMin")} type="number" min={0} className={inputCls} />
              </Field>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">근무 요일</p>
              <div className="flex gap-1">
                {WORK_DAYS_KO.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-md border px-2.5 py-1 text-sm transition-colors ${
                      workDays.includes(day)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {wkHrs > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  1일 {dayHrs.toFixed(1)}h × {workDays.length}일 = <strong>주 {wkHrs}시간</strong>
                </p>
              )}
            </div>

            <p className={sectionHdr}>임금</p>
            <Field label="임금 형태">
              <select {...register("wageType")} className={inputCls}>
                <option value="hourly">시급</option>
                <option value="monthly">월급</option>
              </select>
            </Field>
            <Field label={isHourly ? "시급 (원)" : "월급 (원)"}>
              <input
                {...register("wageAmount")}
                type="number"
                min={0}
                className={inputCls}
                placeholder={isHourly ? "10,030 이상" : ""}
              />
            </Field>
            {belowMinWage && (
              <p className="text-xs text-red-500">
                ⚠ 입력값이 2025년 최저시급({fmtKrw(MIN_HOURLY_WAGE)}) 미만입니다.
              </p>
            )}
            {wkAllow && (
              <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1">
                <p className="font-semibold">주휴수당 계산 결과</p>
                <p>주휴시간: {wkAllow.wkAllowHours}h × {fmtKrw(hourly)} = <strong>{fmtKrw(wkAllow.amount)}</strong></p>
                <p>
                  법정 지급 기준(주 15h 이상):&nbsp;
                  {wkAllow.legallyRequired
                    ? <span className="text-green-700">충족 — 지급 의무 있음</span>
                    : <span className="text-amber-600">미달 (주 {wkHrs}h) — 지급 의무 없으나 약정 가능</span>
                  }
                </p>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("weeklyAllowIncluded")} className="rounded" />
              주휴수당을 임금에 포함하여 지급 (포괄 시급)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="급여일 (매월 ___일)">
                <input {...register("payday")} type="number" min={1} max={31} className={inputCls} placeholder="25" />
              </Field>
              <Field label="지급 방법">
                <input {...register("payMethod")} className={inputCls} defaultValue="계좌이체" />
              </Field>
            </div>

            <p className={sectionHdr}>퇴직급여</p>
            <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1">
              <p className="font-semibold">퇴직급여 지급 판단</p>
              <p>
                {severance.eligible
                  ? <span className="text-green-700">✓ {severance.note}</span>
                  : <span className="text-amber-600">△ {severance.note}</span>
                }
              </p>
              <p className="text-muted-foreground">
                * 실제 지급 여부는 전체 근로기간 및 실 근로시간 기준으로 확정됩니다.
              </p>
            </div>

            <p className={sectionHdr}>사회보험</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {(
                [
                  { key: "insEmployment", label: "고용보험" },
                  { key: "insAccident", label: "산재보험" },
                  { key: "insPension", label: "국민연금" },
                  { key: "insHealth", label: "건강보험" },
                ] as const
              ).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1.5">
                  <input type="checkbox" {...register(key)} className="rounded" />
                  {label}
                </label>
              ))}
            </div>

            <p className={sectionHdr}>서명 날짜</p>
            <Field label="계약 체결일">
              <input {...register("signDate")} type="date" className={inputCls} />
            </Field>
          </div>

        </div>

        {/* ── 미리보기 패널 (토글) ── */}
        {showPreview && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">미리보기 — 인쇄 결과</p>
            <div className="contract-doc overflow-auto rounded-lg border border-border bg-white p-6 text-[11px] leading-relaxed text-[#1a1a1a] shadow-lift">
              <ContractDocument
                v={v}
                workDays={workDays}
                wkHrs={wkHrs}
                dayHrs={dayHrs}
                wkAllow={wkAllow}
                severance={severance}
                workLocation={workLocation}
                contractPeriod={contractPeriod}
                signY={signY}
                signM={signM}
                signD={signD}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 인쇄 전용 레이아웃 ── */}
      <div className="hidden print:block">
        <ContractDocument
          v={v}
          workDays={workDays}
          wkHrs={wkHrs}
          dayHrs={dayHrs}
          wkAllow={wkAllow}
          severance={severance}
          workLocation={workLocation}
          contractPeriod={contractPeriod}
          signY={signY}
          signM={signM}
          signD={signD}
        />
      </div>
    </>
  );
}

// ── 공유 계약서 문서 컴포넌트 (미리보기 + 인쇄 공용) ──
function ContractDocument({
  v,
  workDays,
  wkHrs,
  dayHrs,
  wkAllow,
  severance,
  workLocation,
  contractPeriod,
  signY,
  signM,
  signD,
}: {
  v: ContractValues;
  workDays: WorkDayKo[];
  wkHrs: number;
  dayHrs: number;
  wkAllow: ReturnType<typeof calcWeeklyAllowance> | null;
  severance: ReturnType<typeof calcSeveranceEligibility>;
  workLocation: string;
  contractPeriod: string;
  signY: string;
  signM: string;
  signD: string;
}) {
  const isHourly = v.wageType === "hourly";
  const hourly = Number(v.wageAmount) || 0;
  const monthly = Number(v.wageAmount) || 0;

  const check = (b: boolean) => (b ? "☑" : "☐");

  return (
    <div className="font-sans">
      {/* 제목 */}
      <div className="mb-6 text-center">
        <h1 className="text-[20px] font-bold tracking-[0.2em]">근 로 계 약 서</h1>
        <p className="mt-1 text-[10px] text-gray-500">
          근로기준법 제17조 · 기간제및단시간근로자보호등에관한법률 제17조
        </p>
      </div>

      {/* 당사자 */}
      <table className="mb-4 w-full border-collapse text-[11px]">
        <tbody>
          <tr className="border border-gray-400">
            <td className="w-[28%] border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold">
              사업주 (갑)
            </td>
            <td className="px-2 py-1.5">
              <span className="mr-4">상호: {v.storeName || "　　　　"}</span>
              <span>대표자: {v.employerName || "　　　　"}</span>
            </td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold">
              사업장 소재지
            </td>
            <td className="px-2 py-1.5">{v.businessAddress || "　"}</td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold">
              근로자 (을)
            </td>
            <td className="px-2 py-1.5">
              <span className="mr-4">성명: {v.empName || "　　　　"}</span>
              <span>생년월일: {v.empBirth ? v.empBirth.replace(/-/g, ".") : "　　　　　　"}</span>
            </td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold">주소</td>
            <td className="px-2 py-1.5">{v.empAddress || "　"}</td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold">연락처</td>
            <td className="px-2 py-1.5">{v.empPhone || "　　　　　　　"}</td>
          </tr>
        </tbody>
      </table>

      <p className="mb-3 text-[11px]">
        위 당사자는 아래와 같이 근로계약을 체결하고, 각자 성실히 이행할 것을 약속합니다.
      </p>

      {/* 근로 조건 */}
      <table className="mb-4 w-full border-collapse text-[11px]">
        <tbody>
          <tr className="border border-gray-400">
            <td className="w-[28%] border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold align-top">
              ① 계약 유형 및<br />근로계약기간
            </td>
            <td className="px-2 py-1.5">
              <p>{CONTRACT_TYPE_LABEL[v.contractType]}</p>
              <p>{contractPeriod}</p>
              {v.probation && (
                <p className="text-gray-600">수습 기간: 계약 시작일부터 {v.probationDays}개월</p>
              )}
            </td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold">
              ② 근무 장소
            </td>
            <td className="px-2 py-1.5">{workLocation || "　"}</td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold">
              ③ 업무 내용
            </td>
            <td className="px-2 py-1.5">{v.jobDuty || "　"}</td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold align-top">
              ④ 소정근로시간
            </td>
            <td className="px-2 py-1.5">
              <p>
                {v.startTime} ~ {v.endTime}
                &nbsp;(휴게 {v.breakMin || 0}분)
              </p>
              <p>
                근무일: 매주 {workDays.join("·")}요일 (주 {workDays.length}일)
              </p>
              {wkHrs > 0 && (
                <p>주 소정근로시간: {wkHrs}시간 (1일 {dayHrs.toFixed(1)}h × {workDays.length}일)</p>
              )}
            </td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold align-top">
              ⑤ 임금
            </td>
            <td className="px-2 py-1.5 space-y-0.5">
              {isHourly ? (
                <p>시급: {hourly ? hourly.toLocaleString("ko-KR") + "원" : "　　　원"}</p>
              ) : (
                <p>월급: {monthly ? monthly.toLocaleString("ko-KR") + "원" : "　　　　원"}</p>
              )}
              {wkAllow && (
                <p>
                  주휴수당: {wkAllow.amount.toLocaleString("ko-KR")}원&nbsp;
                  ({v.weeklyAllowIncluded ? "임금에 포함" : "별도 지급"})
                </p>
              )}
              <p>임금 지급일: 매월 {v.payday || "__"}일</p>
              <p>지급 방법: {v.payMethod || "계좌이체"}</p>
            </td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold">
              ⑥ 연차유급휴가
            </td>
            <td className="px-2 py-1.5">근로기준법에 따라 부여</td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold">
              ⑦ 사회보험
            </td>
            <td className="px-2 py-1.5">
              {check(v.insEmployment)} 고용보험&emsp;
              {check(v.insAccident)} 산재보험&emsp;
              {check(v.insPension)} 국민연금&emsp;
              {check(v.insHealth)} 건강보험
            </td>
          </tr>
          <tr className="border border-gray-400">
            <td className="border-r border-gray-400 bg-gray-100 px-2 py-1.5 font-semibold align-top">
              ⑧ 퇴직급여
            </td>
            <td className="px-2 py-1.5">
              <p>{severance.eligible ? "지급 대상" : "현재 기준 지급 의무 미해당"}</p>
              <p className="text-gray-500 text-[10px]">({severance.note})</p>
              <p className="text-gray-500 text-[10px]">
                * 실제 지급 여부는 전체 근로기간 및 평균 근로시간 기준으로 확정됩니다.
              </p>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mb-4 text-[11px]">
        이 계약에 정함이 없는 사항은 근로기준법 및 관계 법령에 따릅니다.
        본 계약서는 2부를 작성하여 사업주와 근로자가 각 1부씩 보관합니다.
      </p>

      {/* 서명 */}
      <p className="mb-5 text-right text-[11px]">
        {signY}년&nbsp;&nbsp;{signM}월&nbsp;&nbsp;{signD}일
      </p>

      <div className="flex flex-col gap-3 text-[11px]">
        <div className="flex items-end gap-3 border-b border-gray-400 pb-4">
          <span className="w-16 shrink-0 font-semibold">사 업 주</span>
          <span className="flex-1">
            상호:&nbsp;{v.storeName || "　　　　　　"}&ensp;
            대표자:&nbsp;{v.employerName || "　　　　"}&ensp;
            (서명 또는 인)&nbsp;&nbsp;
            <span className="inline-block w-20 border-b border-gray-400">&nbsp;</span>
          </span>
        </div>
        <div className="flex items-end gap-3 border-b border-gray-400 pb-8">
          <span className="w-16 shrink-0 font-semibold">근 로 자</span>
          <span className="flex-1">
            성명:&nbsp;{v.empName || "　　　　"}&ensp;
            연락처:&nbsp;{v.empPhone || "　　　　　　"}&ensp;
            (서명 또는 인)&nbsp;&nbsp;
            <span className="inline-block w-20 border-b border-gray-400">&nbsp;</span>
          </span>
        </div>
      </div>

      <p className="mt-3 text-[9.5px] text-gray-500">
        ※ 이 계약서는 근로기준법 제17조 및 기간제및단시간근로자보호등에관한법률 제17조에 따라
        근로조건을 명시한 서면입니다.
      </p>
    </div>
  );
}
