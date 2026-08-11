/**
 * 전령(Courier) — 아침 브리핑.
 *
 * ⚠️ 이 모듈은 아무것도 계산하지 않는다.
 *    ERP 숫자를 다시 세지 않고, 이미 만들어진 봉투(Envelope)를 대표가 3분 안에 읽을 수 있는
 *    한 장으로 접기만 한다. 계산을 여기서 또 하면 `signals.ts`와 숫자가 갈라지는 날이 온다
 *    (§14-A ⑥ SSOT).
 *
 * `content-automation-agent/src/discord_brief.py`(Discord Morning Brief, 8섹션)와의 관계:
 *    저쪽은 날씨·뉴스·말씀까지 포함한 **생활 브리핑**이고, 이쪽은 "지금 무엇을 누구에게 어떤
 *    경로로 전달해야 하는가"만 보는 **전달 브리핑**이다. 겹치는 ERP 수치는 양쪽 다 각자
 *    계산하지 않고 상류(erp_engine / erpSnapshot)에서 받아 쓴다.
 *
 * 여기서도 발송하지 않는다. 브리핑 자체가 하나의 봉투가 되어 같은 라우팅을 탄다.
 */

import type { Envelope, EnvelopeDraft, Priority } from "./types";

/** 긴급·중요 봉투 본문을 이 줄 수까지만 보여준다. 아침에 읽는 글이라 길면 안 읽힌다. */
const BODY_PREVIEW_LINES = 6;

export interface MorningCounts {
  긴급: number;
  중요: number;
  일반: number;
  /** 보낼 채널이 하나도 없는 봉투 수. */
  미전달: number;
}

export interface MorningBrief {
  date: string;
  /** 한 줄 요약 — 알림 제목이나 푸시로 그대로 쓸 수 있는 길이. */
  headline: string;
  markdown: string;
  counts: MorningCounts;
  /** 봉투가 하나도 없었는가. "조용한 아침"과 "고장난 아침"을 구분하기 위한 표시. */
  quiet: boolean;
  envelope: EnvelopeDraft;
}

/**
 * 오늘 날짜(한국 기준).
 *
 * `new Date().toISOString()`을 그대로 자르면 서버가 UTC일 때 한국 시각 오전 9시가 전날로 찍힌다.
 * 아침 브리핑에서 날짜가 하루 밀리면 그날 브리핑이 통째로 어제 것이 된다.
 * sv-SE 로캘은 YYYY-MM-DD 형식을 그대로 준다.
 */
export function seoulDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(now);
}

/** 본문을 앞부분만 보여주고, 잘랐으면 잘랐다고 밝힌다(조용히 자르지 않는다). */
function preview(body: string): string {
  const lines = body.split("\n");
  if (lines.length <= BODY_PREVIEW_LINES) return lines.map((line) => `  ${line}`).join("\n");
  return [
    ...lines.slice(0, BODY_PREVIEW_LINES).map((line) => `  ${line}`),
    `  … 외 ${lines.length - BODY_PREVIEW_LINES}줄 (전문은 발송대기함에서 확인)`,
  ].join("\n");
}

function section(title: string, envelopes: Envelope[], emptyNote: string, detailed: boolean): string {
  if (envelopes.length === 0) return `## ${title}\n${emptyNote}`;

  const items = envelopes.map((envelope) => {
    const head = `- **${envelope.subject}**`;
    const meta = `  근거: ${envelope.source}`;
    return detailed ? [head, preview(envelope.body), meta].join("\n") : [head, meta].join("\n");
  });

  return [`## ${title} (${envelopes.length}건)`, ...items].join("\n");
}

/** 채널 현황 — 오늘 무엇으로 보낼 수 있고 무엇이 막혀 있는지. 봉투들이 실제로 받은 판정만 모은다. */
function channelSection(envelopes: Envelope[]): string {
  const seen = new Map<string, { label: string; available: boolean; reason: string | null }>();
  for (const envelope of envelopes) {
    for (const decision of envelope.channels) {
      if (!seen.has(decision.channel)) {
        seen.set(decision.channel, { label: decision.label, available: decision.available, reason: decision.reason });
      }
    }
  }

  if (seen.size === 0) return "## 📡 채널 현황\n판정된 채널이 없습니다(봉투 없음).";

  const rows = [...seen.values()].map((channel) =>
    channel.available ? `- ✅ ${channel.label}` : `- ❌ ${channel.label} — ${channel.reason}`
  );
  return ["## 📡 채널 현황", ...rows].join("\n");
}

function byPriority(envelopes: Envelope[], priority: Priority): Envelope[] {
  return envelopes.filter((envelope) => envelope.priority === priority);
}

/** 봉투들을 아침 브리핑 한 장으로 접는다. 브리핑 자체도 봉투가 되어 같은 경로로 전달된다. */
export function buildMorningBrief(envelopes: Envelope[], date: string = seoulDate()): MorningBrief {
  const urgent = byPriority(envelopes, "긴급");
  const important = byPriority(envelopes, "중요");
  const normal = byPriority(envelopes, "일반");
  const blocked = envelopes.filter((envelope) => !envelope.deliverable);

  const counts: MorningCounts = {
    긴급: urgent.length,
    중요: important.length,
    일반: normal.length,
    미전달: blocked.length,
  };
  const quiet = envelopes.length === 0;

  const headline = quiet
    ? "전달할 것이 없습니다 — 감지된 신호도, 들어온 입력도 없습니다."
    : [
        `긴급 ${counts.긴급}건`,
        `중요 ${counts.중요}건`,
        `일반 ${counts.일반}건`,
        counts.미전달 > 0 ? `전달불가 ${counts.미전달}건` : null,
      ]
        .filter(Boolean)
        .join(" · ");

  const blockedSection =
    blocked.length === 0
      ? "## 🚧 전달하지 못한 것\n없습니다 — 모든 봉투에 보낼 경로가 있습니다."
      : [
          `## 🚧 전달하지 못한 것 (${blocked.length}건)`,
          "보낼 채널이 하나도 없어 대표님이 직접 확인하셔야 합니다.",
          ...blocked.map(
            (envelope) =>
              `- **${envelope.subject}** — ${envelope.channels.map((c) => `${c.label}: ${c.reason}`).join(" / ")}`
          ),
        ].join("\n");

  const markdown = [
    `# ☀️ 전령 아침 브리핑 — ${date}`,
    "",
    `**한 줄**: ${headline}`,
    "",
    section("🔴 지금 처리해야 할 것", urgent, "긴급 없음 — 확인했고, 없습니다.", true),
    "",
    section("🟡 승인·검토 대기", important, "대기 중인 건 없습니다.", true),
    "",
    section("⚪ 참고", normal, "참고 항목 없음.", false),
    "",
    blockedSection,
    "",
    channelSection(envelopes),
    "",
    "---",
    "전령은 발송하지 않습니다. 이 브리핑은 대표님 확인 후 나갑니다(AI-STAFF-POLICY §4).",
  ].join("\n");

  return {
    date,
    headline,
    markdown,
    counts,
    quiet,
    envelope: {
      // 같은 날 여러 번 실행해도 같은 id다 — 중복 전달을 막는다.
      id: `morning:${date}`,
      origin: "내부신호",
      priority: counts.긴급 > 0 ? "긴급" : "일반",
      audience: "대표",
      subject: `☀️ 아침 브리핑 ${date} — ${headline}`,
      body: markdown,
      source: quiet ? "봉투 없음(전령 자체 판정)" : `전령 봉투 ${envelopes.length}건 요약`,
    },
  };
}
