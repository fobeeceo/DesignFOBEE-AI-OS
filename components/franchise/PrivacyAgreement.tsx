import type { UseFormRegisterReturn } from "react-hook-form";

interface PrivacyAgreementProps {
  id: string;
  registration: UseFormRegisterReturn;
  error?: string;
}

/**
 * 상담 폼 개인정보 수집·이용 동의 (필수) — CEO 업무지시(가맹상담 시스템 구축).
 * 동의 문구는 /privacy 처리방침 페이지와 항목이 일치해야 한다(수정 시 함께 확인).
 */
export function PrivacyAgreement({ id, registration, error }: PrivacyAgreementProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex items-start gap-3 text-sm leading-relaxed">
        <input
          id={id}
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-accent"
          {...registration}
        />
        <span>
          개인정보 수집·이용에 동의합니다. <span className="text-accent">(필수)</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            수집항목: 이름·연락처(필수), 이메일·창업 정보·문의 내용(선택) / 목적: 가맹 상담 진행 및 안내 /
            보유기간: 상담 종료 후 3년{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
              전문 보기
            </a>
          </span>
        </span>
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
