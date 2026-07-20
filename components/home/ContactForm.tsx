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

/**
 * 홈페이지 상담 신청 폼.
 * 클라이언트 검증(zod) → POST /api/leads → 결과 상태 표시.
 */
export function ContactForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { source: "homepage_contact_form" },
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
        <p className="text-lg font-semibold">상담 신청이 접수되었습니다.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          빠른 시일 내에 담당자가 연락드리겠습니다.
        </p>
        <Button className="mt-6" variant="outline" onClick={() => setState("idle")}>
          다시 작성하기
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">이름 *</Label>
        <Input id="name" placeholder="홍길동" {...register("name")} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">연락처 *</Label>
        <Input id="phone" placeholder="010-1234-5678" {...register("phone")} />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="message">문의 내용</Label>
        <Textarea
          id="message"
          placeholder="어떤 공간을 계획하고 계신가요?"
          {...register("message")}
        />
        {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
      </div>

      {state === "error" && errorMsg && (
        <p className="text-sm text-red-500">{errorMsg}</p>
      )}

      <Button type="submit" size="lg" disabled={state === "submitting"}>
        {state === "submitting" ? "전송 중..." : "상담 신청하기"}
      </Button>
    </form>
  );
}
