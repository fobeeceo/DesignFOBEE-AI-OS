/**
 * 헤르메스(Hermes) — AI HQ 전령.
 *
 * 네 가지 일을 하나의 파이프라인으로 처리한다.
 *   ① 내부 신호 감지   lib/hermes/signals.ts
 *   ② 대외 응대 초안   lib/hermes/reply.ts
 *   ③ 부서 배분        lib/hermes/directory.ts
 *   ④ 외부 소식 전달   lib/hermes/briefing.ts
 *
 * 네 갈래가 전부 같은 봉투(Envelope) 형태로 합류한 다음, 같은 라우팅 규칙(channels.ts)을
 * 통과해 발송대기함(Outbox)에 쌓인다. 업무마다 다른 알림 코드를 쓰지 않는 것이 이 설계의 목적이다.
 *
 * 다른 agents/*와 달리 LLM을 호출하지 않는다. 전달은 판단이 아니라 규칙이고, 같은 입력이면
 * 같은 봉투가 나와야 중복 발송을 막을 수 있기 때문이다.
 *
 * 이 에이전트는 발송하지 않는다. Outbox.delivered는 항상 false다(AI-STAFF-POLICY §4).
 */

import { routeChannels } from "@/lib/hermes/channels";
import { detectSignals, type QualitySignalInput } from "@/lib/hermes/signals";
import { draftReply, type InquiryInput, type ReplyDraft } from "@/lib/hermes/reply";
import { routeTask, type TaskRouting } from "@/lib/hermes/directory";
import { buildBriefing, type BriefingInput, type Briefing } from "@/lib/hermes/briefing";
import type { Envelope, EnvelopeDraft, Outbox } from "@/lib/hermes/types";
import type { ErpData } from "@/lib/hq/types";

export class HermesAgentError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "HermesAgentError";
  }
}

export interface HermesInput {
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

export interface HermesResult {
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

/** 네 갈래 입력을 받아 발송대기함 하나로 만든다. 입력이 전부 비어 있으면 오류로 알린다. */
export function runHermes(input: HermesInput = {}): HermesResult {
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

  if (drafts.length === 0) {
    throw new HermesAgentError("전달할 내용이 없습니다. 감지된 신호도, 처리할 입력도 없습니다.", "NOTHING_TO_DELIVER");
  }

  return { outbox: assembleOutbox(drafts), details: { signals, replies, routings, briefings } };
}
