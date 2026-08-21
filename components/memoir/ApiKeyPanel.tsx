"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { MEMOIR_DAILY_IP_LIMIT } from "@/lib/constants";

/**
 * 「내 API 키」 — /design 스튜디오와 같은 방식.
 *
 * 하루 무료 횟수를 다 썼거나 서버에 키가 없을 때, 본인 키를 넣으면 계속 쓸 수 있다.
 * 키는 이 브라우저에만 저장되고, AI를 부를 때만 서버를 거쳐 Google로 간다 — 우리가 보관하지 않는다.
 *
 * ⚠️ 기본은 접어둔다. 대부분의 사용자에게 "API 키"는 낯선 말이고,
 *    처음부터 펼쳐 보이면 뭔가 준비해야 하는 줄 알고 그냥 나간다.
 */
interface ApiKeyPanelProps {
  value: string;
  onChange: (next: string) => void;
  /** 무료 잔여 횟수. null이면 아직 모름(한 번도 안 눌러봄) 또는 개인 키 사용 중. */
  remaining: number | null;
  /** 오류로 이 패널이 필요해진 상황이면 펼친 채로 연다. */
  forceOpen?: boolean;
}

export function ApiKeyPanel({ value, onChange, remaining, forceOpen }: ApiKeyPanelProps) {
  const [open, setOpen] = useState(false);
  const expanded = open || forceOpen;
  const using = value.trim().length > 0;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#A8998A]">
        {using ? (
          <span className="text-[#4E6B57]">내 API 키로 쓰고 있습니다 · 횟수 제한 없음</span>
        ) : (
          <span>
            오늘 남은 무료 횟수{" "}
            <strong className="font-semibold text-[#6B6255]">
              {remaining === null ? MEMOIR_DAILY_IP_LIMIT : remaining}회
            </strong>
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-[#6B6255]"
        >
          <KeyRound className="h-3.5 w-3.5" />
          {expanded ? "닫기" : using ? "키 바꾸기" : "내 API 키 쓰기"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 rounded-2xl border border-[#E5DFD4] bg-white px-5 py-4">
          <p className="text-[15px] leading-relaxed text-[#5C5346]">
            본인 Google AI 키를 넣으면 무료 횟수와 상관없이 쓰실 수 있습니다. 키는{" "}
            <strong className="font-semibold text-[#1B1815]">이 휴대폰에만 저장</strong>되고
            저희가 보관하지 않습니다.
          </p>

          <label className="mt-3 block">
            <span className="text-[13px] font-semibold text-[#6B6255]">내 Google AI API 키</span>
            <input
              type="password"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="AIza..."
              autoComplete="off"
              spellCheck={false}
              className="mt-1 h-12 w-full rounded-xl border border-[#D5CFC3] px-4 text-[16px] text-[#1B1815] outline-none focus:border-[#8C4A32]"
            />
          </label>

          <p className="mt-3 text-[13px] leading-relaxed text-[#A8998A]">
            키는{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-[#6B6255]"
            >
              Google AI Studio
            </a>
            에서 무료로 발급받습니다. 구글 계정으로 로그인해 「API 키 만들기」를 누르면 됩니다.
          </p>

          {using && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="mt-3 text-[14px] text-[#8C4A32] underline underline-offset-4"
            >
              내 키 지우고 무료 횟수 쓰기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
