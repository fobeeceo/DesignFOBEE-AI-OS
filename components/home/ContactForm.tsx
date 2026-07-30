"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, type LeadFormValues } from "@/lib/validations/lead.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { CreateLeadResponse } from "@/types/lead";

type SubmitState = "idle" | "submitting" | "success" | "error";

export type ContactFormVariant = "interior" | "ai_design";

/** CEO 업무지시(상담 신청 개선): 상담 목적을 폼에서 직접 선택하도록 드롭다운 추가. */
const PURPOSE_OPTIONS = [
  "가맹 상담",
  "인테리어 상담",
  "교회 인테리어",
  "상업공간",
  "견적 문의",
  "기타",
] as const;

const VARIANT_DEFAULT_PURPOSE: Record<ContactFormVariant, (typeof PURPOSE_OPTIONS)[number]> = {
  interior: "인테리어 상담",
  ai_design: "견적 문의",
};

/**
 * 상담 유형별 설정 — CEO 업무지시(Sprint 2 P1) "인테리어/가맹/AI디자인 상담 완전 분리".
 * 폼 필드(이름·연락처·이메일·문의내용)는 3개 유형이 동일하게 공유하되(중복 검증 로직 방지),
 * source 값·문구로 유형을 구분해 CRM(관리자 리드 목록)에서 필터링 가능하게 한다.
 * 문의내용 placeholder와 성공/실패 메시지는 CEO 업무지시(상담 신청 개선)에 따라
 * 3개 유형 공통 문구로 통일했다(상담 목적은 이제 별도 드롭다운으로 구분하므로).
 */
const MESSAGE_PLACEHOLDER =
  "문의 내용을 자유롭게 작성해 주세요. 프로젝트 규모, 희망 일정, 상담 목적 등을 함께 작성해 주시면 더욱 정확하게 안내해 드립니다.";
const SUCCESS_TITLE = "감사합니다.";
const SUCCESS_BODY = "상담 신청이 정상적으로 접수되었습니다. 담당자가 빠르게 연락드리겠습니다.";
const ERROR_MESSAGE_FALLBACK = "현재 접수가 지연되고 있습니다.";

const VARIANT_CONFIG: Record<ContactFormVariant, { source: string; submitLabel: string }> = {
  interior: {
    source: "homepage_interior_consultation",
    submitLabel: "인테리어 상담 신청하기",
  },
  ai_design: {
    source: "homepage_ai_design_consultation",
    submitLabel: "이 AI 디자인으로 상담·견적 받기",
  },
};

/**
 * 상담 신청 폼 — variant로 인테리어/가맹/AI디자인 상담을 구분한다(POST /api/leads).
 * 실행 주의: 현재 Supabase/Postgres 연결이 일시정지 상태라 실제 제출은 500으로 실패할 수 있다
 * (2026-07-29 확인, 이 폼의 버그가 아니라 인프라 문제) — 그래서 실패 시에도 리드를 놓치지
 * 않도록 전화·이메일 폴백 안내를 함께 보여준다.
 */
export function ContactForm({ variant = "interior" }: { variant?: ContactFormVariant }) {
  const [state, setState] = useState<SubmitState>("idle");
  const [purpose, setPurpose] = useState<string>(VARIANT_DEFAULT_PURPOSE[variant]);
  const config = VARIANT_CONFIG[variant];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { source: config.source },
  });

  async function onSubmit(values: LeadFormValues) {
    setState("submitting");

    try {
      const message = `[상담 목적: ${purpose}]${values.message ? `\n${values.message}` : ""}`;
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, message }),
      });
      const data: CreateLeadResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "상담 신청에 실패했습니다.");
      }

      setState("success");
      reset();
    } catch (err) {
      console.error("[ContactForm]", err);
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-8 text-center">
        <p className="text-lg font-semibold">{SUCCESS_TITLE}</p>
        <p className="mt-2 text-sm text-muted-foreground">{SUCCESS_BODY}</p>
        <Button className="mt-6" variant="outline" onClick={() => setState("idle")}>
          다시 작성하기
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${variant}-name`}>이름 *</Label>
        <Input id={`${variant}-name`} placeholder="홍길동" {...register("name")} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${variant}-phone`}>연락처 *</Label>
        <Input id={`${variant}-phone`} placeholder="010-1234-5678" {...register("phone")} />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${variant}-email`}>이메일</Label>
        <Input id={`${variant}-email`} type="email" placeholder="you@example.com" {...register("email")} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${variant}-purpose`}>상담 목적</Label>
        <Select
          id={`${variant}-purpose`}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        >
          {PURPOSE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${variant}-message`}>문의 내용</Label>
        <Textarea id={`${variant}-message`} placeholder={MESSAGE_PLACEHOLDER} {...register("message")} />
        {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
      </div>

      {state === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <p>{ERROR_MESSAGE_FALLBACK}</p>
          <p className="mt-1 text-xs">
            급하신 경우{" "}
            <a href="tel:0225171474" className="font-semibold underline">02-517-1474</a>
            {" 또는 "}
            <a href="mailto:ceo@fobee.co.kr" className="font-semibold underline">ceo@fobee.co.kr</a>
            {" 로 연락 부탁드립니다."}
          </p>
        </div>
      )}

      <Button type="submit" size="lg" disabled={state === "submitting"}>
        {state === "submitting" ? "전송 중..." : config.submitLabel}
      </Button>
    </form>
  );
}
