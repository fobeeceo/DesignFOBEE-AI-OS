"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LeadDiagnosisResult } from "@/types/lead";

interface ThankYouModalProps {
  open: boolean;
  onClose: () => void;
  diagnosis?: LeadDiagnosisResult;
}

/** CEO 업무지시 지정 문구 — 임의 변경 금지. */
const TITLE = "감사합니다.";
const BODY = "상담 신청이 정상적으로 접수되었습니다. 전문 컨설턴트가 확인 후 빠르게 연락드리겠습니다.";

/**
 * 가맹상담 신청 완료 화면 (Franchise AI v2.0).
 * 접수 확인에서 끝내지 않고 접수번호 + AI 창업 적합도 + 맞춤 성공사례까지 이어서 보여준다.
 * ⚠️ 적합도 점수는 상담 우선순위를 위한 참고 지표이며 가맹 승인·거절 결과가 아니다.
 */
export function ThankYouModal({ open, onClose, diagnosis }: ThankYouModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="thankyou-title"
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-lg rounded-2xl border border-border bg-background p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
          <p id="thankyou-title" className="mt-4 text-lg font-semibold">
            {TITLE}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{BODY}</p>
        </div>

        {diagnosis?.referenceNo && (
          <div className="mt-6 rounded-xl bg-muted/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">상담 접수번호</p>
            <p className="mt-1 text-base font-bold tracking-wider">{diagnosis.referenceNo}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              문의 시 이 번호를 말씀해주시면 빠르게 확인됩니다.
            </p>
          </div>
        )}

        {diagnosis && (
          <div className="mt-4 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-accent">AI 창업 적합도 진단</p>
              <p className="text-sm" aria-label={`5점 만점에 ${diagnosis.stars}점`}>
                <span aria-hidden="true">
                  {"★".repeat(diagnosis.stars)}
                  <span className="text-muted-foreground">{"★".repeat(5 - diagnosis.stars)}</span>
                </span>
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold text-accent">{diagnosis.fitScore}점</p>
            <p className="mt-1 text-sm font-semibold">{diagnosis.headline}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{diagnosis.description}</p>
            <p className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
              ※ 입력하신 창업 조건을 기준으로 한 참고 지표이며, 가맹 승인 여부를 결정하는 심사 결과가
              아닙니다.
            </p>
          </div>
        )}

        {diagnosis && diagnosis.recommendedCases.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-accent">추천 사례</p>
            <div className="mt-3 flex flex-col gap-3">
              {diagnosis.recommendedCases.map((item) => (
                <div key={item.code} className="flex gap-3 rounded-xl border border-border p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button ref={closeRef} className="mt-6 w-full" onClick={onClose}>
          확인
        </Button>
      </div>
    </div>
  );
}
