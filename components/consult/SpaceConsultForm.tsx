"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { COMPANY } from "@/lib/company/profile";
import {
  ACCEPTED_EXT,
  ACCEPTED_MIME,
  CONSULT_NOTICE,
  CONSULT_PRIVACY_NOTE,
  CONSULT_SOURCE,
  CONSULT_TIMINGS,
  MAX_FILES,
  MAX_FILE_SIZE,
  SPACE_STATES,
  SPACE_TYPES,
} from "@/lib/consult/content";

/**
 * 공간 상담 신청 폼 — 도면 업로드 포함.
 *
 * ⚠️ Reveal 미사용, opacity:0 미사용. JS가 실패해도 폼은 보인다.
 * ⚠️ 입력 글자 크기 16px — iOS Safari는 16px 미만이면 포커스 시 화면을 확대한다.
 * ⚠️ 여기서 하는 검증은 사용자 편의용이다. 진짜 방어는 서버(/api/space-consult)에 있다.
 */

type SubmitState = "idle" | "submitting" | "done" | "error";

const inputClass =
  "w-full border border-border bg-white px-3.5 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground";

function formatSize(bytes: number) {
  return bytes < 1048576
    ? `${Math.round(bytes / 1024)}KB`
    : `${(bytes / 1048576).toFixed(1)}MB`;
}

function extOf(name: string) {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

export function SpaceConsultForm() {
  const [spaceType, setSpaceType] = useState("");
  const [spaceState, setSpaceState] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [fileError, setFileError] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: File[]) {
    const next = [...files];
    let msg = "";

    for (const f of incoming) {
      if (next.length >= MAX_FILES) {
        msg = `최대 ${MAX_FILES}개까지 첨부하실 수 있습니다.`;
        break;
      }
      if (f.size > MAX_FILE_SIZE) {
        msg = `"${f.name}" 은 10MB를 넘습니다.`;
        continue;
      }
      const okType =
        (ACCEPTED_MIME as readonly string[]).includes(f.type) ||
        (ACCEPTED_EXT as readonly string[]).includes(extOf(f.name));
      if (!okType) {
        msg = `"${f.name}" 은 보내실 수 없는 형식입니다. JPG·PNG·PDF만 가능합니다.`;
        continue;
      }
      next.push(f);
    }

    setFiles(next);
    setFileError(msg);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const miss: string[] = [];
    if (!spaceType) miss.push("공간 유형");
    if (!spaceState) miss.push("현재 상태");
    if (!String(fd.get("region") ?? "").trim()) miss.push("지역");
    if (files.length === 0) miss.push("도면 첨부");
    if (!String(fd.get("name") ?? "").trim()) miss.push("성함");
    if (!String(fd.get("phone") ?? "").trim()) miss.push("연락처");
    if (fd.get("privacyConsent") !== "on") miss.push("개인정보 동의");

    if (miss.length > 0) {
      setErrors(miss);
      return;
    }

    setErrors([]);
    setState("submitting");

    fd.set("spaceType", spaceType);
    fd.set("spaceState", spaceState);
    fd.set("source", CONSULT_SOURCE);
    files.forEach((f) => fd.append("drawings", f));

    try {
      const res = await fetch("/api/space-consult", { method: "POST", body: fd });
      if (!res.ok) throw new Error("submit failed");
      setState("done");
      window.scrollTo(0, 0);
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <section className="pt-2">
        <div className="bg-foreground px-6 py-11 text-center text-background">
          <div aria-hidden className="text-[42px] leading-none">
            ⌂
          </div>
          <h2 className="mb-2.5 mt-4 text-xl font-bold">접수되었습니다</h2>
          <p className="text-[15px] leading-relaxed opacity-80">
            1영업일 안에 연락드리겠습니다.
            <br />
            보내주신 도면은 상담 목적으로만 사용합니다.
          </p>
        </div>
        <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
          급하신 경우 {COMPANY.phone} 로 전화 주시면 바로 도와드리겠습니다.
          <br />
          {COMPANY.name} · 대표이사 {COMPANY.ceo ?? "이대성"}
        </p>
      </section>
    );
  }

  return (
    <section id="apply">
      <h2 className="text-xl font-bold text-foreground">상담 신청</h2>
      <p className="mb-6 mt-2 text-[15px] text-muted-foreground">
        아래 내용을 남겨주시면 1영업일 안에 연락드립니다.
      </p>

      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        {/* 공간 유형 */}
        <fieldset className="mb-6">
          <legend className="mb-2.5 text-[13.5px] font-medium text-foreground">
            공간 유형<span className="ml-1 text-[11px] text-accent">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {SPACE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSpaceType(t)}
                aria-pressed={spaceType === t}
                className={`border px-4 py-2.5 text-sm transition-colors ${
                  spaceType === t
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-white text-muted-foreground hover:border-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        {/* 현재 상태 */}
        <fieldset className="mb-6">
          <legend className="mb-2.5 text-[13.5px] font-medium text-foreground">
            현재 상태<span className="ml-1 text-[11px] text-accent">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {SPACE_STATES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpaceState(s)}
                aria-pressed={spaceState === s}
                className={`border px-4 py-2.5 text-sm transition-colors ${
                  spaceState === s
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-white text-muted-foreground hover:border-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mb-6">
          <label htmlFor="area" className="mb-2.5 block text-[13.5px] font-medium text-foreground">
            면적
          </label>
          <input id="area" name="area" type="text" className={inputClass} placeholder="예: 20평 / 66㎡ / 잘 모르겠습니다" />
        </div>

        <div className="mb-6">
          <label htmlFor="region" className="mb-2.5 block text-[13.5px] font-medium text-foreground">
            지역<span className="ml-1 text-[11px] text-accent">*</span>
          </label>
          <input id="region" name="region" type="text" className={inputClass} placeholder="예: 서울 은평구 / 경기 고양시" />
        </div>

        <div className="mb-6">
          <label htmlFor="timing" className="mb-2.5 block text-[13.5px] font-medium text-foreground">
            공사 예정 시기
          </label>
          <select id="timing" name="timing" className={inputClass} defaultValue="">
            <option value="">선택해 주세요</option>
            {CONSULT_TIMINGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* 도면 첨부 */}
        <div className="mb-6">
          <span className="mb-2.5 block text-[13.5px] font-medium text-foreground">
            도면 첨부<span className="ml-1 text-[11px] text-accent">*</span>
          </span>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles([...e.dataTransfer.files]);
            }}
            className={`w-full border border-dashed px-5 py-8 text-center transition-colors ${
              dragging ? "border-accent bg-muted" : "border-border bg-white hover:border-accent"
            }`}
          >
            <span aria-hidden className="mb-2 block font-mono text-xl text-accent">
              ⌗
            </span>
            <span className="block text-[14.5px] font-medium text-foreground">
              도면을 여기에 올려주세요
            </span>
            <span className="mt-1 block text-[12.5px] text-muted-foreground">
              JPG · PNG · PDF · 최대 {MAX_FILES}개 / 개당 10MB
            </span>
          </button>

          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            hidden
            onChange={(e) => addFiles([...(e.target.files ?? [])])}
          />

          {files.length > 0 && (
            <ul className="mt-2.5">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="mb-1.5 flex items-center justify-between bg-muted px-3 py-2.5 text-[13px] text-foreground"
                >
                  <span className="truncate pr-3">
                    {f.name} · {formatSize(f.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={`${f.name} 삭제`}
                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    className="shrink-0 px-1 text-muted-foreground hover:text-accent"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {fileError && <p className="mt-2 text-[13px] text-accent">{fileError}</p>}

          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            손으로 그린 스케치, 부동산에서 받은 평면도, 벽에 붙은 도면을 찍은 사진도 괜찮습니다.
            도면이 없으시면 공간 사진만 보내주셔도 됩니다.
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="message" className="mb-2.5 block text-[13.5px] font-medium text-foreground">
            원하시는 방향 <span className="font-light text-muted-foreground">(선택)</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className={`${inputClass} min-h-24 resize-y leading-relaxed`}
            placeholder="예) 좌석은 20석 정도, 창가에 긴 테이블을 두고 싶습니다. 벽돌 느낌을 살렸으면 합니다."
          />
        </div>

        <div className="mb-6">
          <label htmlFor="name" className="mb-2.5 block text-[13.5px] font-medium text-foreground">
            성함<span className="ml-1 text-[11px] text-accent">*</span>
          </label>
          <input id="name" name="name" type="text" className={inputClass} placeholder="홍길동" />
        </div>

        <div className="mb-6">
          <label htmlFor="phone" className="mb-2.5 block text-[13.5px] font-medium text-foreground">
            연락처<span className="ml-1 text-[11px] text-accent">*</span>
          </label>
          <input id="phone" name="phone" type="tel" className={inputClass} placeholder="010-0000-0000" />
        </div>

        <div className="mb-6">
          <label htmlFor="email" className="mb-2.5 block text-[13.5px] font-medium text-foreground">
            이메일 <span className="font-light text-muted-foreground">(3D 시안을 받으실 주소)</span>
          </label>
          <input id="email" name="email" type="email" className={inputClass} placeholder="name@example.com" />
        </div>

        <div className="mb-6 flex items-start gap-3 border border-border bg-white p-4">
          <input
            id="privacyConsent"
            name="privacyConsent"
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--accent))]"
          />
          <label htmlFor="privacyConsent" className="text-[13px] font-light leading-relaxed text-muted-foreground">
            상담 진행을 위한 개인정보 수집·이용에 동의합니다. 수집 항목은 성함·연락처·이메일·도면이며,
            상담 종료 후 1년간 보관 후 파기합니다.{" "}
            <Link href="/privacy" target="_blank" rel="noopener" className="text-foreground underline underline-offset-2">
              개인정보처리방침
            </Link>
          </label>
        </div>

        {errors.length > 0 && (
          <p role="alert" className="mb-3 text-sm text-accent">
            {errors.join(", ")} 을(를) 확인해 주세요.
          </p>
        )}

        {state === "error" && (
          <p role="alert" className="mb-3 text-sm text-accent">
            전송에 실패했습니다. 잠시 후 다시 시도해 주시거나 {COMPANY.phone} 로 연락 주십시오.
          </p>
        )}

        <button
          type="submit"
          disabled={state === "submitting"}
          className="mt-2 w-full bg-foreground px-4 py-4 text-[15.5px] font-medium text-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-border"
        >
          {state === "submitting" ? "보내는 중…" : "상담 신청하기"}
        </button>
      </form>

      <div className="mt-6 border-l-2 border-accent bg-muted px-5 py-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{CONSULT_NOTICE}</p>
      </div>

      <footer className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        {COMPANY.name} · 대표이사 {COMPANY.ceo ?? "이대성"} · {COMPANY.phone}
        <br />
        {COMPANY.address}
        <br />
        {CONSULT_PRIVACY_NOTE}
      </footer>
    </section>
  );
}
