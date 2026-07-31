"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  franchiseLeadSchema,
  type FranchiseLeadFormValues,
} from "@/lib/validations/lead.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PrivacyAgreement } from "@/components/franchise/PrivacyAgreement";
import { ThankYouModal } from "@/components/franchise/ThankYouModal";
import { COMPANY } from "@/lib/company/profile";
import { FRANCHISE_SOURCE } from "@/lib/franchise/constants";
import type { CreateLeadResponse, LeadDiagnosisResult } from "@/types/lead";

type SubmitState = "idle" | "submitting" | "success" | "error";

const REGIONS = [
  "서울", "경기", "인천", "강원", "대전", "세종", "충남", "충북",
  "대구", "경북", "부산", "울산", "경남", "광주", "전남", "전북", "제주", "미정",
];

const TIMINGS = ["3개월 이내", "6개월 이내", "1년 이내", "1년 이후", "미정"];

const INVESTMENTS = [
  "1억 원 미만",
  "1억 ~ 1.5억 원",
  "1.5억 ~ 2억 원",
  "2억 원 이상",
  "상담 후 결정",
];

const PURPOSES = ["신규창업", "업종변경", "가맹문의", "투자문의", "기타"];

const STOREFRONT_OPTIONS = [
  { label: "선택해주세요", value: "" },
  { label: "보유하고 있습니다", value: "true" },
  { label: "아직 없습니다", value: "false" },
];

/**
 * 가맹상담 신청 폼 — /franchise 전용. 홈페이지 범용 ContactForm과 달리 창업 조건
 * (희망지역·예정시기·예상투자금·직업·점포보유)까지 수집해 상담 전 사전 파악을 돕는다.
 * 실행 주의: Supabase 연결이 일시정지된 상태에서는 제출이 500으로 실패할 수 있어
 * (인프라 문제, 폼 버그 아님) 실패 시 전화·이메일 폴백 안내를 반드시 노출한다.
 */
export function ConsultForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [diagnosis, setDiagnosis] = useState<LeadDiagnosisResult | undefined>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FranchiseLeadFormValues>({
    resolver: zodResolver(franchiseLeadSchema),
    defaultValues: { source: FRANCHISE_SOURCE, consultationPurpose: "신규창업" },
  });

  async function onSubmit(values: FranchiseLeadFormValues) {
    setState("submitting");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: CreateLeadResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "상담 신청에 실패했습니다.");
      }

      setDiagnosis(data.diagnosis);
      setState("success");
      reset();
    } catch (err) {
      console.error("[ConsultForm]", err);
      setState("error");
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="franchise-name">이름 *</Label>
            <Input id="franchise-name" placeholder="홍길동" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="franchise-phone">연락처 *</Label>
            <Input id="franchise-phone" placeholder="010-1234-5678" {...register("phone")} />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="franchise-email">이메일</Label>
            <Input
              id="franchise-email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="franchise-purpose">상담 목적</Label>
            <Select id="franchise-purpose" {...register("consultationPurpose")}>
              {PURPOSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="franchise-region">창업 희망지역</Label>
            <Select id="franchise-region" defaultValue="" {...register("preferredRegion")}>
              <option value="">선택해주세요</option>
              {REGIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="franchise-timing">창업 예정시기</Label>
            <Select id="franchise-timing" defaultValue="" {...register("plannedTiming")}>
              <option value="">선택해주세요</option>
              {TIMINGS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="franchise-investment">예상 투자금</Label>
            <Select id="franchise-investment" defaultValue="" {...register("expectedInvestment")}>
              <option value="">선택해주세요</option>
              {INVESTMENTS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="franchise-occupation">현재 직업</Label>
            <Input
              id="franchise-occupation"
              placeholder="예: 직장인 / 자영업 / 준비 중"
              {...register("currentOccupation")}
            />
            {errors.currentOccupation && (
              <p className="text-xs text-red-500">{errors.currentOccupation.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="franchise-storefront">점포 보유 여부</Label>
            <Select
              id="franchise-storefront"
              defaultValue=""
              {...register("hasStorefront", {
                setValueAs: (v) => (v === "" ? undefined : v === "true"),
              })}
            >
              {STOREFRONT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="franchise-message">문의 내용</Label>
          <Textarea
            id="franchise-message"
            placeholder="문의 내용을 자유롭게 작성해 주세요. 프로젝트 규모, 희망 일정, 상담 목적 등을 함께 작성해 주시면 더욱 정확하게 안내해 드립니다."
            {...register("message")}
          />
          {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
        </div>

        <PrivacyAgreement
          id="franchise-privacy"
          registration={register("privacyConsent")}
          error={errors.privacyConsent?.message}
        />

        {state === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <p>현재 접수가 지연되고 있습니다.</p>
            <p className="mt-1 text-xs">
              급하신 경우{" "}
              <a href={`tel:${COMPANY.phone.replace(/-/g, "")}`} className="font-semibold underline">
                {COMPANY.phone}
              </a>
              {" 또는 "}
              <a href={`mailto:${COMPANY.email}`} className="font-semibold underline">
                {COMPANY.email}
              </a>
              {" 로 연락 부탁드립니다."}
            </p>
          </div>
        )}

        <Button type="submit" size="lg" disabled={state === "submitting"}>
          {state === "submitting" ? "전송 중..." : "무료 가맹상담 신청"}
        </Button>
      </form>

      <ThankYouModal
        open={state === "success"}
        diagnosis={diagnosis}
        onClose={() => setState("idle")}
      />
    </>
  );
}
