/**
 * 헤르메스 역할 ② — 대외 문의 응대 초안.
 *
 * 문의 문장에서 무엇을 묻는지 찾아, `lib/franchise/publicFacts.ts`의 공개 항목만 인용해
 * 답변 초안을 만든다. LLM을 쓰지 않는 것이 이 모듈의 핵심 설계다 — 생성 모델은 아는 것과
 * 그럴듯한 것을 구분하지 못해서, 공개하지 않기로 한 수치(가맹점 수·평균 매출)를 문맥에 맞게
 * 지어낼 수 있다. 인용 가능한 문장만 조립하면 그 위험이 구조적으로 사라진다(§0-2 원칙 2).
 *
 * 초안은 초안이다. 사람이 읽고 고쳐 보낸다(AI-STAFF-POLICY §4).
 */

import { LEGAL_NOTICE, publicFacts, RESTRICTED_TOPICS } from "@/lib/franchise/publicFacts";
import type { EnvelopeDraft } from "./types";

export interface InquiryInput {
  /** 문의자 이름. 없으면 "고객님"으로 부른다. */
  name?: string;
  /** 문의 원문. */
  message: string;
  /** 유입 경로(franchise_page 등). 기록용. */
  source?: string;
  /** 상담 접수번호나 리드 ID — 봉투 id를 안정시키는 데 쓴다. */
  reference?: string;
}

export interface ReplyDraft {
  envelope: EnvelopeDraft;
  /** 인용한 공개 항목 key. */
  quoted: string[];
  /** 상담으로 넘긴 비공개 주제 key. */
  deferred: string[];
  /** 어느 항목에도 걸리지 않았는가 — 사람이 반드시 손봐야 한다는 신호. */
  needsHuman: boolean;
  legalNoticeIncluded: boolean;
}

function matches(message: string, keywords: string[]): boolean {
  return keywords.some((keyword) => message.includes(keyword));
}

/** 문의에 대한 응대 초안을 만든다. 공개 기준 밖의 것은 답을 지어내지 않고 상담으로 넘긴다. */
export function draftReply(inquiry: InquiryInput): ReplyDraft {
  const message = inquiry.message ?? "";
  const who = inquiry.name?.trim() || "고객님";

  const facts = publicFacts().filter((fact) => matches(message, fact.keywords));
  const restricted = RESTRICTED_TOPICS.filter((topic) => matches(message, topic.keywords));
  const needsHuman = facts.length === 0 && restricted.length === 0;
  const needsLegalNotice = facts.some((fact) => fact.needsLegalNotice);

  const sections: string[] = [`${who}, GBRICK Coffee 가맹 상담 문의 감사합니다.`, ""];

  if (facts.length > 0) {
    sections.push("문의하신 내용에 대해 안내드립니다.", "");
    for (const fact of facts) {
      sections.push(`■ ${fact.label}`, fact.value);
      // 불리해 보이는 단서를 답변 안에 같이 넣는다 — 나중에 알게 되는 것보다 낫다(§0-2 원칙 3).
      if (fact.caveat) sections.push(fact.caveat);
      sections.push("");
    }
  }

  if (restricted.length > 0) {
    sections.push("아래 항목은 문서로 안내드리지 않고 상담에서 직접 말씀드립니다.", "");
    for (const topic of restricted) {
      sections.push(`■ ${topic.label}`, topic.guide, "");
    }
  }

  if (needsHuman) {
    sections.push(
      "문의 내용을 자동으로 분류하지 못했습니다. 담당자가 직접 확인 후 연락드리겠습니다.",
      ""
    );
  }

  sections.push("더 궁금한 점은 상담을 통해 자세히 안내해 드리겠습니다.");
  if (needsLegalNotice) sections.push("", LEGAL_NOTICE);

  const body = sections.join("\n").trimEnd();
  const reference = inquiry.reference ?? "unlinked";

  return {
    envelope: {
      id: `reply:${reference}`,
      origin: "대외문의",
      priority: needsHuman ? "중요" : "일반",
      audience: "문의자",
      subject: needsHuman
        ? `[초안·확인필요] ${who} 문의 응대`
        : `[초안] ${who} 문의 응대`,
      body,
      source: `문의 원문(${inquiry.source ?? "경로 미기재"}) + CLAUDE.md §0-5 대외 노출 기준`,
    },
    quoted: facts.map((fact) => fact.key),
    deferred: restricted.map((topic) => topic.key),
    needsHuman,
    legalNoticeIncluded: needsLegalNotice && body.includes(LEGAL_NOTICE),
  };
}
