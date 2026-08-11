/**
 * 전령 — 채널 레지스트리와 라우팅 규칙.
 *
 * 채널 가용성은 선언하지 않고 *판정*한다. 환경변수가 실제로 있는지 매 호출 시점에 확인해
 * available/reason을 만든다. 그래서 "카카오톡으로 보냈습니다" 같은 문장이 나올 수 없다 —
 * 연동이 없으면 없다고 나온다(§0-2 원칙 2).
 *
 * TODO.md 기준 현재 실제로 연결된 것은 이메일(Resend)뿐이고 Telegram Bot·카카오 채널은
 * 대표 계정 작업이 필요한 상태다. 그 상태를 코드가 그대로 드러내게 둔다.
 */

import type { Audience, ChannelDecision, ChannelKey, Priority } from "./types";

interface ChannelSpec {
  key: ChannelKey;
  label: string;
  /** 사용 가능하면 null, 불가능하면 그 사유를 돌려준다. */
  blockedReason: () => string | null;
}

const CHANNEL_SPECS: ChannelSpec[] = [
  {
    key: "email",
    label: "이메일(Resend)",
    blockedReason: () => {
      if (!process.env.RESEND_API_KEY) return "RESEND_API_KEY 미설정";
      if (!process.env.LEAD_NOTIFY_TO?.trim()) return "LEAD_NOTIFY_TO 수신자 미설정";
      return null;
    },
  },
  {
    key: "discord",
    label: "Discord",
    blockedReason: () =>
      process.env.DISCORD_WEBHOOK_URL ? null : "DISCORD_WEBHOOK_URL 미설정 — 현재 Discord 브리핑은 수동 실행",
  },
  {
    key: "notion",
    label: "Notion(AI 제안함)",
    blockedReason: () =>
      process.env.NOTION_API_KEY ? null : "NOTION_API_KEY 미설정 — Internal Integration 연결이 대표 계정 작업으로 남아 있음",
  },
  {
    key: "telegram",
    label: "Telegram",
    blockedReason: () =>
      process.env.TELEGRAM_BOT_TOKEN ? null : "Telegram Bot 미생성 (TODO.md — 대표 계정 작업 필요)",
  },
  {
    key: "kakao",
    label: "카카오톡 채널",
    blockedReason: () => "카카오 비즈니스 API 미연동 (TODO.md — 외부서비스 가입 대상, CEO 승인 필요)",
  },
];

const SPEC_BY_KEY = new Map(CHANNEL_SPECS.map((spec) => [spec.key, spec]));

/** 한 채널의 현재 상태를 판정한다. */
export function channelStatus(key: ChannelKey, fallback = false): ChannelDecision {
  const spec = SPEC_BY_KEY.get(key);
  if (!spec) {
    return { channel: key, label: key, available: false, reason: "알 수 없는 채널", fallback };
  }
  const reason = spec.blockedReason();
  return { channel: key, label: spec.label, available: reason === null, reason, fallback };
}

/** 지금 실제로 쓸 수 있는 채널 목록. 대시보드·보고에서 "무엇이 막혀 있는가"를 보여줄 때 쓴다. */
export function channelBoard(): ChannelDecision[] {
  return CHANNEL_SPECS.map((spec) => channelStatus(spec.key));
}

/**
 * 수신자와 중요도에 따른 우선 채널.
 *
 * 문의자에게 Discord·Notion을 보낼 수는 없다 — 사내 도구이기 때문이다.
 * 수신자 구분을 먼저 하고 그 다음에 중요도를 보는 순서가 중요하다.
 */
export function preferredChannels(priority: Priority, audience: Audience): ChannelKey[] {
  if (audience === "문의자") return ["email"];
  if (audience === "가맹점주") return ["email", "kakao"];

  if (priority === "긴급") return ["telegram", "discord", "email"];
  if (priority === "중요") return ["discord", "notion", "email"];
  return ["notion"];
}

/**
 * 우선 채널을 판정하고, 긴급인데 전부 막혔으면 남은 채널이라도 찾아 fallback으로 붙인다.
 *
 * 긴급에만 대체 경로를 여는 이유: 전령의 일은 "규칙대로 시도했다"가 아니라 "닿았다"이다.
 * 다만 일반·중요 건까지 아무 채널로나 흘려보내면 대표 메일함이 잡음으로 찬다.
 */
export function routeChannels(priority: Priority, audience: Audience): ChannelDecision[] {
  const preferred = preferredChannels(priority, audience).map((key) => channelStatus(key));
  if (priority !== "긴급" || preferred.some((decision) => decision.available)) {
    return preferred;
  }

  const tried = new Set(preferred.map((decision) => decision.channel));
  const rescue = CHANNEL_SPECS.filter((spec) => !tried.has(spec.key))
    .map((spec) => channelStatus(spec.key, true))
    .filter((decision) => decision.available);

  return [...preferred, ...rescue];
}
