"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, type LeadFormValues } from "@/lib/validations/lead.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { CreateLeadResponse } from "@/types/lead";

type SubmitState = "idle" | "submitting" | "success" | "error";

export type ContactFormVariant = "interior" | "franchise" | "ai_design";

/**
 * 상담 유형별 설정 — CEO 업무지시(Sprint 2 P1) "인테리어/가맹/AI디자인 상담 완전 분리".
 * 폼 필드(이름·연락처·이메일·문의내용)는 3개 유형이 동일하게 공유하되(중복 검증 로직 방지),
 * source 값·문구·placeholder로 유형을 구분해 CRM(관리자 리드 목록)에서 필터링 가능하게 한다.
 */
const VARIANT_CONFIG: Record<
  ContactFormVariant,
  { source: string; messagePlaceholder: string; submitLabel: string; successTitle: string; successBody: string }
> = {
  interior: {
    source: "homepage_interior_consultation",
    messagePlaceholder: "어떤 공간을 계획하고 계신가요? (예: 20평 카페 인테리어)",
    submitLabel: "인테리어 상담 신청하기",
    successTitle: "인테리어 상담 신청이 접수되었습니다.",
    successBody: "빠른 시일 내에 담당 디자이너가 연락드리겠습니다.",
  },
  franchise: {
    source: "homepage_franchise_consultation",
    messagePlaceholder: "희망 지역·개설 예정 시기를 남겨주시면 더 정확히 안내해드려요.",
    submitLabel: "GBRICK Coffee 가맹 상담 신청하기",
    successTitle: "가맹 상담 신청이 접수되었습니다.",
    successBody: "가맹 담당자가 정보공개서·창업비용 안내와 함께 연락드리겠습니다.",
  },
  ai_design: {
    source: "homepage_ai_design_consultation",
    messagePlaceholder: "방금 확인한 AI 디자인에 대해 궁금한 점을 남겨주세요.",
    submitLabel: "이 AI 디자인으로 상담·견적 받기",
    successTitle: "AI 디자인 상담 신청이 접수되었습니다.",
    successBody: "방금 확인하신 디자인을 기준으로 전문가가 예상 견적과 함께 연락드리겠습니다.",
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
    setErrorMsg(null);

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

      setState("success");
      reset();
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-8 text-center">
        <p className="text-lg font-semibold">{config.successTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{config.successBody}</p>
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
        <Label htmlFor={`${variant}-message`}>문의 내용</Label>
        <Textarea id={`${variant}-message`} placeholder={config.messagePlaceholder} {...register("message")} />
        {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
      </div>

      {state === "error" && errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <p>{errorMsg}</p>
          <p className="mt-1 text-xs">
            폼 접수가 지연되고 있습니다 — 급하시면 바로 연락 주세요: {" "}
            <a href="tel:0225171474" className="font-semibold underline">02-517-1474</a>
            {" · "}
            <a href="mailto:ceo@fobee.co.kr" className="font-semibold underline">ceo@fobee.co.kr</a>
          </p>
        </div>
      )}

      <Button type="submit" size="lg" disabled={state === "submitting"}>
        {state === "submitting" ? "전송 중..." : config.submitLabel}
      </Button>
    </form>
  );
}
