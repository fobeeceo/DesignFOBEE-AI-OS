/**
 * 상담 리드 이메일 알림 — 문의 유실 방지 이중 안전장치.
 *
 * 배경: Supabase 무료 플랜은 7일간 저활동 시 자동 일시정지된다. 정지 상태에서 들어온 상담은
 * 500 오류만 남기고 사라진다. 공간디자인은 건당 단가가 커서 문의 1건 유실 비용이 인프라
 * 비용의 수십 배다. 그래서 DB 저장 성공/실패와 무관하게 상담 원문을 대표 메일로 보낸다.
 *
 * 설계 원칙
 * - 신규 npm 의존성 0개. Resend REST API를 fetch로 직접 호출한다.
 * - RESEND_API_KEY가 없으면 알림만 비활성화되고 나머지 동작은 그대로다(무파괴).
 * - 이 모듈은 절대 throw 하지 않는다. 알림 실패가 상담 접수를 깨뜨리면 안 된다.
 * - 사용자 입력은 HTML에 넣기 전 반드시 이스케이프한다(HTML 인젝션 차단).
 */

import type { CreateLeadInput } from "@/types/lead";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "DesignFOBEE <onboarding@resend.dev>";

export interface LeadNotificationContext {
  /** DB 저장 성공 여부. false면 이 메일이 유일한 기록이 된다. */
  saved: boolean;
  leadId?: string;
  referenceNo?: string | null;
  /** 저장 실패 사유(오류 메시지). 실패 메일 본문에 넣어 원인 파악을 돕는다. */
  failureReason?: string;
}

/** HTML 특수문자 이스케이프 — 상담자가 넣은 텍스트가 메일에서 태그로 해석되지 않게 한다. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** LEAD_NOTIFY_TO는 쉼표로 여러 명을 받을 수 있다. 공백·빈 값은 제거한다. */
export function parseRecipients(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function buildSubject(input: CreateLeadInput, context: LeadNotificationContext): string {
  const who = `${input.name} / ${input.phone}`;
  const via = input.source;
  return context.saved
    ? `[상담신청] ${who} (${via})`
    : `[⚠️DB실패·상담신청] ${who} (${via})`;
}

/** 메일에 표시할 항목 목록 — 값이 있는 것만 추린다. */
function fieldRows(input: CreateLeadInput, context: LeadNotificationContext) {
  const yesNo = (v: boolean | undefined) => (v === true ? "예" : v === false ? "아니오" : undefined);

  return [
    { label: "이름", value: input.name },
    { label: "연락처", value: input.phone },
    { label: "이메일", value: input.email },
    { label: "유입 경로", value: input.source },
    { label: "상담 목적", value: input.consultationPurpose },
    { label: "창업 희망지역", value: input.preferredRegion },
    { label: "창업 예정시기", value: input.plannedTiming },
    { label: "예상 투자금", value: input.expectedInvestment },
    { label: "현재 직업", value: input.currentOccupation },
    { label: "점포 보유", value: yesNo(input.hasStorefront) },
    { label: "개인정보 동의", value: yesNo(input.privacyConsent) },
    { label: "접수번호", value: context.referenceNo ?? undefined },
    { label: "Lead ID", value: context.leadId },
    { label: "문의 내용", value: input.message },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));
}

export function buildText(input: CreateLeadInput, context: LeadNotificationContext): string {
  const lines = fieldRows(input, context).map((row) => `${row.label}: ${row.value}`);
  const header = context.saved
    ? "새 상담 신청이 접수되었습니다."
    : [
        "⚠️ DB 저장에 실패했습니다. 이 메일이 유일한 기록이니 삭제하지 마세요.",
        context.failureReason ? `실패 사유: ${context.failureReason}` : "",
      ]
        .filter(Boolean)
        .join("\n");

  return [header, "", ...lines, "", `수신 시각: ${new Date().toISOString()}`].join("\n");
}

export function buildHtml(input: CreateLeadInput, context: LeadNotificationContext): string {
  const rows = fieldRows(input, context)
    .map(
      (row) =>
        `<tr><th align="left" style="padding:6px 12px 6px 0;vertical-align:top;white-space:nowrap;color:#555">${escapeHtml(
          row.label
        )}</th><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(row.value)}</td></tr>`
    )
    .join("");

  const banner = context.saved
    ? `<p style="margin:0 0 16px">새 상담 신청이 접수되었습니다.</p>`
    : `<div style="margin:0 0 16px;padding:12px 16px;border:1px solid #e11d48;border-radius:8px;background:#fef2f2;color:#b91c1c">
         <strong>⚠️ DB 저장에 실패했습니다. 이 메일이 유일한 기록이니 삭제하지 마세요.</strong>
         ${context.failureReason ? `<div style="margin-top:6px;font-size:12px">실패 사유: ${escapeHtml(context.failureReason)}</div>` : ""}
       </div>`;

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#111">
      ${banner}
      <table style="border-collapse:collapse">${rows}</table>
      <p style="margin:16px 0 0;font-size:12px;color:#888">수신 시각: ${escapeHtml(new Date().toISOString())}</p>
    </div>`;
}

/**
 * 상담 알림 메일을 보낸다. 성공하면 true, 보내지 못했으면 false.
 * 어떤 경우에도 예외를 던지지 않는다 — 호출부의 응답 흐름을 방해하면 안 되기 때문이다.
 */
export async function sendLeadNotification(
  input: CreateLeadInput,
  context: LeadNotificationContext
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = parseRecipients(process.env.LEAD_NOTIFY_TO);
  const from = process.env.LEAD_NOTIFY_FROM || DEFAULT_FROM;

  if (!apiKey || to.length === 0) {
    // 설정이 없으면 알림만 비활성화한다(무파괴). 저장 실패 상황이면 최소한 로그로는 남긴다.
    if (!context.saved) {
      console.error("[leadEmail] 알림 미설정 상태에서 DB 저장 실패 — 리드 원문:", {
        ...input,
        failureReason: context.failureReason,
      });
    }
    return false;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: buildSubject(input, context),
        html: buildHtml(input, context),
        text: buildText(input, context),
        // 상담자 이메일이 있으면 메일함에서 바로 회신할 수 있게 한다.
        ...(input.email ? { reply_to: input.email } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[leadEmail] Resend 응답 오류", res.status, detail.slice(0, 300));
      return false;
    }

    return true;
  } catch (error) {
    console.error("[leadEmail] 발송 실패", error);
    return false;
  }
}
