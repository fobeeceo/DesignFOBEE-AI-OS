/**
 * 전령(Courier) — AI HQ 전령.
 *
 * 네 가지 일을 하나의 파이프라인으로 처리한다.
 *   ① 내부 신호 감지   lib/courier/signals.ts
 *   ② 대외 응대 초안   lib/courier/reply.ts
 *   ③ 부서 배분        lib/courier/directory.ts
 *   ④ 외부 소식 전달   lib/courier/briefing.ts
 *
 * 네 갈래가 전부 같은 봉투(Envelope) 형태로 합류한 다음, 같은 라우팅 규칙(channels.ts)을
 * 통과해 발송대기함(Outbox)에 쌓인다. 업무마다 다른 알림 코드를 쓰지 않는 것이 이 설계의 목적이다.
 *
 * 다른 agents/*와 달리 LLM을 호출하지 않는다. 전달은 판단이 아니라 규칙이고, 같은 입력이면
 * 같은 봉투가 나와야 중복 발송을 막을 수 있기 때문이다.
 *
 * 이 에이전트는 발송하지 않는다. Outbox.delivered는 항상 false다(AI-STAFF-POLICY §4).
 */

import { routeChannels } from "@/lib/courier/channels";
import { detectSignals, type QualitySignalInput } from "@/lib/courier/signals";
import { draftReply, type InquiryInput, type ReplyDraft } from "@/lib/courier/reply";
import { routeTask, type TaskRouting } from "@/lib/courier/directory";
import { buildBriefing, type BriefingInput, type Briefing } from "@/lib/courier/briefing";
import { buildMorningBrief, seoulDate, type MorningBrief } from "@/lib/courier/morning";
import type { Envelope, EnvelopeDraft, Outbox } from "@/lib/courier/types";
import type { ErpData } from "@/lib/hq/types";

export class CourierAgentError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "CourierAgentError";
  }
}

export interface CourierInput {
  /** ① 내부 신호를 감지할 ERP 데이터. 없으면 스냅샷을 쓴다. */
  erp?: ErpData;
  quality?: QualitySignalInput;
  /** ② 응대 초안을 만들 문의 목록. */
  inquiries?: InquiryInput[];
  /** ③ 담당을 배분할 업무 목록. */
  tasks?: { id?: string; task: string }[];
  /** ④ 전달할 외부 소식(이미 수집된 것). */
  briefings?: BriefingInput[];
}

export interface MorningInput extends CourierInput {
  /** 브리핑 기준일(YYYY-MM-DD). 없으면 한국 시각 오늘. */
  date?: string;
}

export interface MorningResult {
  brief: MorningBrief;
  /** 브리핑 봉투까지 포함한 발송대기함. */
  outbox: Outbox;
  details: CourierResult["details"];
}

export interface CourierResult {
  outbox: Outbox;
  /** 각 업무의 상세 결과 — 봉투만으로는 알 수 없는 판정(인용한 사실, 담당 상태 등)을 남긴다. */
  details: {
    signals: EnvelopeDraft[];
    replies: ReplyDraft[];
    routings: TaskRouting[];
    briefings: Briefing[];
  };
}

/** 봉투 원안에 채널을 붙여 완성한다. 같은 봉투는 항상 같은 채널 판정을 받는다. */
export function seal(draft: EnvelopeDraft): Envelope {
  const channels = routeChannels(draft.priority, draft.audience);
  return { ...draft, channels, deliverable: channels.some((decision) => decision.available) };
}

/** 봉투 원안들을 발송대기함으로 조립한다. id가 같은 봉투는 하나로 합친다(중복 전달 방지). */
export function assembleOutbox(drafts: EnvelopeDraft[]): Outbox {
  const unique = new Map<string, EnvelopeDraft>();
  for (const draft of drafts) {
    unique.set(draft.id, draft);
  }

  const envelopes = [...unique.values()].map(seal);
  return {
    generatedAt: new Date().toISOString(),
    envelopes,
    delivered: false,
    undeliverable: envelopes.filter((envelope) => !envelope.deliverable).map((envelope) => envelope.id),
  };
}

/** 네 갈래 입력을 봉투 원안으로 바꾼다. 비어 있어도 오류로 보지 않는다 — 판단은 호출부가 한다. */
function collect(input: CourierInput) {
  const signals = detectSignals(input.erp, input.quality);
  const replies = (input.inquiries ?? []).map(draftReply);
  const routings = (input.tasks ?? []).map((item) => routeTask(item.task, item.id));
  const briefings = (input.briefings ?? []).map(buildBriefing);

  const drafts = [
    ...signals,
    ...replies.map((reply) => reply.envelope),
    ...routings.map((routing) => routing.envelope),
    ...briefings.map((briefing) => briefing.envelope),
  ];

  return { drafts, details: { signals, replies, routings, briefings } };
}

/** 네 갈래 입력을 받아 발송대기함 하나로 만든다. 입력이 전부 비어 있으면 오류로 알린다. */
export function runCourier(input: CourierInput = {}): CourierResult {
  const { drafts, details } = collect(input);

  if (drafts.length === 0) {
    throw new CourierAgentError("전달할 내용이 없습니다. 감지된 신호도, 처리할 입력도 없습니다.", "NOTHING_TO_DELIVER");
  }

  return { outbox: assembleOutbox(drafts), details };
}

/**
 * 아침 브리핑을 만든다.
 *
 * `runCourier`와 달리 봉투가 하나도 없어도 오류를 내지 않는다. 조용한 아침에도 브리핑은 나가야
 * 하기 때문이다 — 아무것도 안 오는 것과 "오늘은 조용합니다"가 오는 것은 다르다. 앞의 경우
 * 대표는 시스템이 멈춘 건지 조용한 건지 알 수 없다.
 */
export function runMorning(input: MorningInput = {}): MorningResult {
  const { drafts, details } = collect(input);
  const date = input.date ?? seoulDate();

  // 브리핑은 이미 봉인된 봉투들을 보고 접는다(어느 채널이 막혔는지 알아야 하기 때문).
  const brief = buildMorningBrief(drafts.map(seal), date);

  // 브리핑 봉투를 맨 앞에 둔다 — 대표가 가장 먼저 받는 한 장이다.
  return { brief, outbox: assembleOutbox([brief.envelope, ...drafts]), details };
}
