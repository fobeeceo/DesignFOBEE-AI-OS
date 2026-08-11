/**
 * 헤르메스 역할 ④ — 외부 소식 전달.
 *
 * ⚠️ 이 모듈은 수집하지 않는다. 수집은 이미 담당이 있다 —
 *    `content-automation-agent/src/trend_research.py`(AI Trend Researcher),
 *    `src/agents/news_agent.py`, `/api/hq/design-trends`(AI 웹디자인전략가).
 *    헤르메스가 또 긁어오면 같은 데이터가 두 곳에서 나오게 된다(§14-A ⑥ SSOT 위반).
 *
 * 그래서 여기서는 이미 수집된 항목을 받아 "전달 가능한 한 장"으로 포장만 한다. 전령의 일은
 * 소식을 만드는 게 아니라 옮기는 것이다.
 *
 * 들어온 항목이 없으면 빈 브리핑을 만들지 않고 "확인 필요"로 정직하게 남긴다(§0-2 원칙 2).
 */

import type { EnvelopeDraft } from "./types";

export interface ExternalItem {
  title: string;
  summary?: string;
  url?: string;
  /** 어디서 왔는가 — 출처 없는 항목은 전달하지 않는다. */
  source: string;
}

export interface BriefingInput {
  /** 브리핑 주제(예: "웹디자인 트렌드", "정부 지원사업"). */
  topic: string;
  items: ExternalItem[];
  /** 브리핑 기준일(YYYY-MM-DD). 봉투 id를 안정시킨다. */
  date: string;
}

export interface Briefing {
  envelope: EnvelopeDraft;
  /** 출처가 없어 제외한 항목 수. 조용히 버리지 않고 세어서 알린다. */
  dropped: number;
  empty: boolean;
}

/** 수집된 외부 항목을 전달용 봉투로 포장한다. 내용을 요약·각색하지 않고 그대로 옮긴다. */
export function buildBriefing({ topic, items, date }: BriefingInput): Briefing {
  const usable = items.filter((item) => item.title?.trim() && item.source?.trim());
  const dropped = items.length - usable.length;
  const empty = usable.length === 0;

  const body = empty
    ? [
        `${date} 기준 ${topic} 수집 결과가 없습니다.`,
        "수집기가 돌지 않았는지, 새 소식이 없었는지는 이 데이터만으로 구분할 수 없습니다 — 확인이 필요합니다.",
      ].join("\n")
    : [
        `${date} ${topic} · ${usable.length}건`,
        "",
        ...usable.map((item, index) => {
          const lines = [`${index + 1}. ${item.title} (출처: ${item.source})`];
          if (item.summary) lines.push(`   ${item.summary}`);
          if (item.url) lines.push(`   ${item.url}`);
          return lines.join("\n");
        }),
        dropped > 0 ? `\n※ 제목 또는 출처가 없어 ${dropped}건을 제외했습니다.` : "",
      ]
        .filter(Boolean)
        .join("\n");

  return {
    envelope: {
      id: `briefing:${topic}:${date}`,
      origin: "외부소식",
      priority: "일반",
      audience: "대표",
      subject: empty ? `[확인필요] ${topic} — 수집 결과 없음` : `${topic} ${usable.length}건`,
      body,
      source: empty ? "수집기 산출물 없음" : [...new Set(usable.map((item) => item.source))].join(", "),
    },
    dropped,
    empty,
  };
}
