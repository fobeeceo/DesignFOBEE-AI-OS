/**
 * 전령(Courier) — AI HQ 전달 계층(Delivery Layer) 공통 타입.
 *
 * 전령는 전령이다. 내용을 새로 만드는 역할이 아니라, 이미 사실인 것을 *올바른 상대에게*
 * *올바른 경로로* 옮기는 역할이다. 그래서 이 계층의 중심 개념은 "봉투(Envelope)" 하나다.
 * 내부 신호든 대외 문의든 부서 요청이든 외부 소식이든, 전부 봉투로 정규화한 다음 같은
 * 라우팅 규칙을 통과한다.
 *
 * 절대 원칙 — 전령는 스스로 보내지 않는다.
 * 산출물은 항상 발송대기함(Outbox)까지이고, 실제 발송은 사람이 승인한 뒤에 이뤄진다
 * (AI-STAFF-POLICY.md §4 실행 권한 원칙). 그래서 Outbox.delivered는 타입 수준에서 false로 고정돼 있다.
 */

/** 봉투가 어디서 왔는가 — 전령의 4가지 업무에 각각 대응한다. */
export type Origin =
  /** ① 내부 신호: ERP·QA·Audit에서 감지한 것 */
  | "내부신호"
  /** ② 대외 문의: 가맹/시공 문의에 대한 응대 초안 */
  | "대외문의"
  /** ③ 부서 요청: 어느 AI 직원이 맡아야 하는지 배분한 결과 */
  | "부서요청"
  /** ④ 외부 소식: 트렌드·뉴스 등 밖에서 들어온 것 */
  | "외부소식";

export type Priority = "긴급" | "중요" | "일반";

export type Audience = "대표" | "본사" | "가맹점주" | "문의자";

export type ChannelKey = "email" | "discord" | "notion" | "telegram" | "kakao";

/** 한 채널을 이 봉투에 쓸 수 있는가에 대한 판정. 추측하지 않고 실제 설정으로 판단한다. */
export interface ChannelDecision {
  channel: ChannelKey;
  label: string;
  available: boolean;
  /** available=false인 이유. 사용 가능하면 null. "왜 못 보내는지"를 항상 남긴다(§0-2 원칙 7). */
  reason: string | null;
  /** 우선 채널이 전부 막혀서 대신 고른 경로인가. */
  fallback: boolean;
}

/** 각 업무 모듈이 만들어내는 봉투 원안. 라우팅 전 상태라 채널이 아직 없다. */
export interface EnvelopeDraft {
  /** 같은 사건이면 같은 값이 나오는 안정된 식별자(중복 전달 방지). */
  id: string;
  origin: Origin;
  priority: Priority;
  audience: Audience;
  subject: string;
  body: string;
  /** 이 내용의 근거. 근거 없는 봉투는 만들지 않는다(§0-2 원칙 7). */
  source: string;
}

/** 라우팅을 마친 봉투. */
export interface Envelope extends EnvelopeDraft {
  channels: ChannelDecision[];
  /** 실제로 보낼 수 있는 채널이 하나라도 있는가. */
  deliverable: boolean;
}

/**
 * 발송대기함. 전령의 최종 산출물이며, 여기서 멈춘다.
 * delivered가 리터럴 false인 것은 실수가 아니다 — "보냈다"고 쓸 수 있는 코드 경로를
 * 타입 단계에서 없애기 위한 것이다.
 */
export interface Outbox {
  generatedAt: string;
  envelopes: Envelope[];
  delivered: false;
  /** 보낼 채널이 하나도 없는 봉투의 id — 대표가 직접 확인해야 하는 목록이다. */
  undeliverable: string[];
}
