"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThankYouModalProps {
  open: boolean;
  onClose: () => void;
}

/** CEO 업무지시 지정 문구 — 임의 변경 금지. */
const TITLE = "감사합니다.";
const BODY = "상담 신청이 정상적으로 접수되었습니다. 전문 컨설턴트가 확인 후 빠르게 연락드리겠습니다.";

/**
 * 가맹상담 신청 완료 모달. 폼을 화면에서 치우지 않고 완료 사실만 확실히 전달한다
 * (신청 직후 이탈해도 접수 여부를 명확히 인지시키는 것이 목적).
 */
export function ThankYouModal({ open, onClose }: ThankYouModalProps) {
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-background p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
        <p id="thankyou-title" className="mt-4 text-lg font-semibold">
          {TITLE}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{BODY}</p>
        <Button ref={closeRef} className="mt-6 w-full" onClick={onClose}>
          확인
        </Button>
      </div>
    </div>
  );
}
