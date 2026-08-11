/**
 * 헤르메스 테스트 — 네 역할이 각각 "지어내지 않는가"를 확인한다.
 * 문장 표현이 아니라 판정(무엇을 인용했나·어디로 보내나·못 보내면 못 보낸다고 하나)을 검사한다.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { channelStatus, preferredChannels, routeChannels } from "./channels";
import { detectSignals, COST_RATIO_ALERT } from "./signals";
import { draftReply } from "./reply";
import { routeTask } from "./directory";
import { buildBriefing } from "./briefing";
import { runHermes, assembleOutbox, HermesAgentError } from "@/agents/hermesAgent";
import { LEGAL_NOTICE } from "@/lib/franchise/publicFacts";
import { ERP_SNAPSHOT } from "@/lib/hq/erpSnapshot";
import type { ErpData } from "@/lib/hq/types";

const ENV_KEYS = ["RESEND_API_KEY", "LEAD_NOTIFY_TO", "DISCORD_WEBHOOK_URL", "NOTION_API_KEY", "TELEGRAM_BOT_TOKEN"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("channels — 연동 안 된 채널을 사용 가능하다고 하지 않는다", () => {
  it("카카오톡은 어떤 환경변수를 넣어도 미연동으로 남는다", () => {
    const kakao = channelStatus("kakao");
    expect(kakao.available).toBe(false);
    expect(kakao.reason).toContain("미연동");
  });

  it("이메일은 키와 수신자가 둘 다 있어야 사용 가능하다", () => {
    process.env.RESEND_API_KEY = "test-key";
    expect(channelStatus("email").available).toBe(false);

    process.env.LEAD_NOTIFY_TO = "ceo@fobee.co.kr";
    expect(channelStatus("email").available).toBe(true);
  });

  it("문의자에게는 사내 채널(Discord·Notion)을 쓰지 않는다", () => {
    expect(preferredChannels("긴급", "문의자")).toEqual(["email"]);
  });

  it("긴급인데 우선 채널이 전부 막히면 남은 채널을 대체 경로로 붙인다", () => {
    // 우선순위는 telegram → discord → email인데, 열려 있는 건 notion뿐인 상황.
    process.env.NOTION_API_KEY = "test-token";
    const routed = routeChannels("긴급", "대표");
    const rescue = routed.find((decision) => decision.fallback);
    expect(rescue?.channel).toBe("notion");
    expect(rescue?.available).toBe(true);
  });

  it("일반 건은 채널이 막혀도 대체 경로를 열지 않는다", () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.LEAD_NOTIFY_TO = "ceo@fobee.co.kr";
    expect(routeChannels("일반", "대표").every((decision) => !decision.fallback)).toBe(true);
  });
});

describe("signals — 숫자를 데이터에서 계산한다", () => {
  it("ERP 스냅샷의 긴급 재고 3건을 긴급 봉투로 만든다", () => {
    const urgent = detectSignals().find((draft) => draft.id.startsWith("signal:inventory-urgent"));
    expect(urgent?.priority).toBe("긴급");
    expect(urgent?.subject).toContain("3건");
  });

  it("원가율 경보는 임계치 이상 메뉴만 담는다", () => {
    const costly = detectSignals().find((draft) => draft.id.startsWith("signal:cost-ratio"));
    // 스냅샷 기준 30% 이상은 카페모카(30.9)뿐이다. 아메리카노(24.1)는 들어가면 안 된다.
    expect(costly?.body).toContain("카페모카");
    expect(costly?.body).not.toContain("아메리카노");
    expect(COST_RATIO_ALERT).toBe(30);
  });

  it("QA 실패 건수를 넘기지 않으면 품질 신호를 만들지 않는다", () => {
    expect(detectSignals().some((draft) => draft.id.startsWith("signal:quality-failure"))).toBe(false);
    expect(detectSignals(undefined, { qaFailures: 2 }).some((d) => d.id.startsWith("signal:quality-failure"))).toBe(true);
  });
});

describe("reply — 공개 기준 밖의 것은 답하지 않는다", () => {
  it("창업비용 문의에는 금액과 초과 가능성을 함께 넣고 법정고지를 붙인다", () => {
    const draft = draftReply({ name: "김민수", message: "창업비용이 얼마나 드나요?" });
    expect(draft.quoted).toContain("cost");
    expect(draft.envelope.body).toContain("8,636만원");
    expect(draft.envelope.body).toContain("이보다 높을 수 있습니다");
    expect(draft.legalNoticeIncluded).toBe(true);
    expect(draft.envelope.body).toContain(LEGAL_NOTICE);
  });

  it("가맹점 수·평균 매출을 물으면 수치 대신 상담 안내로 넘긴다", () => {
    const draft = draftReply({ message: "매장 수가 몇 개이고 평균 매출은 얼마인가요?" });
    expect(draft.deferred).toEqual(expect.arrayContaining(["storeCount", "revenue"]));
    expect(draft.envelope.body).toContain("상담에서");
  });

  it("분류하지 못한 문의는 사람 확인 필요로 표시한다", () => {
    const draft = draftReply({ message: "안녕하세요" });
    expect(draft.needsHuman).toBe(true);
    expect(draft.envelope.subject).toContain("확인필요");
  });

  it("문의자에게 가는 봉투는 이메일로만 라우팅된다", () => {
    const draft = draftReply({ message: "창업비용 문의드립니다", reference: "LEAD-1" });
    const outbox = assembleOutbox([draft.envelope]);
    expect(outbox.envelopes[0].channels.map((c) => c.channel)).toEqual(["email"]);
  });
});

describe("directory — 담당을 못 찾으면 임의 배분하지 않는다", () => {
  it("마케팅 요청은 AI 마케터로 배분한다", () => {
    const routing = routeTask("가맹 모집 인스타 카피 만들어줘");
    expect(routing.routes[0].agent).toBe("AI 마케터");
    expect(routing.unmatched).toBe(false);
  });

  it("인사 상태는 AI_STAFF에서 읽어온다 — 정규직이 아니면 검수 경고를 붙인다", () => {
    const routing = routeTask("리드 상담 이력 정리해줘");
    const crm = routing.routes.find((route) => route.agent === "AI CRM");
    expect(crm?.status).toBe("수습");
    expect(crm?.caution).toBe(true);
    expect(routing.envelope.body).toContain("정규직이 아닙니다");
  });

  it("아무 키워드도 안 걸리면 대표에게 그대로 올린다", () => {
    const routing = routeTask("zzzz");
    expect(routing.unmatched).toBe(true);
    expect(routing.envelope.audience).toBe("대표");
  });
});

describe("briefing — 없는 소식을 만들지 않는다", () => {
  it("수집 결과가 비면 확인 필요로 남긴다", () => {
    const briefing = buildBriefing({ topic: "웹디자인 트렌드", items: [], date: "2026-08-11" });
    expect(briefing.empty).toBe(true);
    expect(briefing.envelope.subject).toContain("확인필요");
  });

  it("출처 없는 항목은 세어서 알리고 본문에서 뺀다", () => {
    const briefing = buildBriefing({
      topic: "AI 뉴스",
      date: "2026-08-11",
      items: [
        { title: "실제 소식", source: "trend_research.py" },
        { title: "출처 없음", source: "" },
      ],
    });
    expect(briefing.dropped).toBe(1);
    expect(briefing.envelope.body).toContain("1건을 제외");
  });
});

describe("runHermes — 네 갈래가 하나의 발송대기함으로 합류한다", () => {
  it("발송하지 않는다 · 보낼 채널이 없으면 undeliverable로 남긴다", () => {
    const { outbox } = runHermes({ inquiries: [{ message: "창업비용 문의", reference: "LEAD-9" }] });
    expect(outbox.delivered).toBe(false);
    // 이 테스트 환경에는 RESEND 키가 없으므로 실제로 보낼 수 있는 채널이 없어야 한다.
    expect(outbox.undeliverable).toContain("reply:LEAD-9");
  });

  it("같은 id의 봉투는 한 번만 담는다", () => {
    const draft = draftReply({ message: "창업비용", reference: "LEAD-1" }).envelope;
    expect(assembleOutbox([draft, draft]).envelopes).toHaveLength(1);
  });

  it("전달할 것이 하나도 없으면 오류로 알린다", () => {
    const quietErp: ErpData = {
      ...ERP_SNAPSHOT,
      inventory: { shortageCount: 0, urgentCount: 0, reorders: [], purchaseOrders: [], supplierTotals: [] },
      cost: { avgRatio: 22.6, menus: [] },
      menuEngineering: { available: false, reason: "미계산" },
    };
    expect(() => runHermes({ erp: quietErp })).toThrow(HermesAgentError);
  });
});
