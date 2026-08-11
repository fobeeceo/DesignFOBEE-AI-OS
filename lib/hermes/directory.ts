/**
 * 헤르메스 역할 ③ — 부서 배분(에이전트 라우팅).
 *
 * CLAUDE.md §5의 MASTER AI 절차 중 "②담당부서 지정"을 코드로 옮긴 것이다.
 * 헤르메스는 여기서도 실행하지 않는다 — 누가 맡아야 하는지, 그 직원이 지금 맡을 수 있는
 * 상태인지까지만 전달한다. 실제 호출은 사람이나 상위 오케스트레이션이 한다.
 *
 * 인사 상태(정규직/수습/설계…)는 여기에 적지 않고 `AI_STAFF`에서 조회한다. 상태는 재평가마다
 * 바뀌는 값이라 두 곳에 두면 반드시 어긋난다(§14-A ⑥ SSOT).
 */

import { AI_STAFF } from "@/lib/hq/erpSnapshot";
import type { EnvelopeDraft } from "./types";

interface DirectoryEntry {
  /** AI_STAFF에 등록된 이름과 정확히 일치해야 한다 — 상태 조회 키다. */
  agent: string;
  module: string;
  keywords: string[];
}

const DIRECTORY: DirectoryEntry[] = [
  {
    agent: "AI CEO(전략)",
    module: "agents/ceoStrategyAgent.ts",
    keywords: ["전략", "의사결정", "결정", "대안", "리스크", "판단", "방향"],
  },
  {
    agent: "AI 마케터",
    module: "agents/marketerAgent.ts",
    keywords: ["카피", "마케팅", "광고", "홍보", "캡션", "인스타", "블로그 글", "문구"],
  },
  {
    agent: "AI 웹디자인전략가",
    module: "agents/designTrendAgent.ts",
    keywords: ["홈페이지", "웹디자인", "트렌드", "경쟁사", "랜딩", "UI", "화면 개선"],
  },
  {
    agent: "AI 디자이너",
    module: "agents/interiorDesignAgent.ts",
    keywords: ["리디자인", "공간 사진", "인테리어 이미지", "시안", "렌더", "스타일 변경"],
  },
  {
    agent: "AI 메뉴전략가",
    module: "content-automation-agent/src/erp_engine.py",
    keywords: ["메뉴", "단종", "원가율", "판매량", "마진", "메뉴판"],
  },
  {
    agent: "AI CRM",
    module: "services/leadService.ts",
    keywords: ["리드", "상담", "문의 관리", "고객 관리", "응대 이력"],
  },
];

/** AI_STAFF(roles + media)에서 인사 상태를 찾는다. 못 찾으면 지어내지 않고 그대로 표시한다. */
function staffStatus(agent: string): string {
  const found =
    AI_STAFF.roles.find((role) => role.name === agent) ??
    AI_STAFF.media.find((role) => role.name === agent);
  return found?.status ?? "조직도 미등록";
}

export interface AgentRoute {
  agent: string;
  module: string;
  status: string;
  matched: string[];
  /** 정규직이 아닌 직원에게 배분됐는가 — 결과를 그대로 믿으면 안 된다는 표시. */
  caution: boolean;
}

export interface TaskRouting {
  task: string;
  routes: AgentRoute[];
  /** 담당을 못 찾았는가. 이때는 대표에게 그대로 올린다. */
  unmatched: boolean;
  envelope: EnvelopeDraft;
}

/** 업무 문장을 읽고 담당 AI 직원을 지정한다. 지정까지만 하고 호출하지 않는다. */
export function routeTask(task: string, taskId?: string): TaskRouting {
  const text = task ?? "";

  const routes: AgentRoute[] = DIRECTORY.map((entry) => {
    const matched = entry.keywords.filter((keyword) => text.includes(keyword));
    const status = staffStatus(entry.agent);
    return { agent: entry.agent, module: entry.module, status, matched, caution: status !== "정규직" };
  })
    .filter((route) => route.matched.length > 0)
    // 키워드가 많이 걸린 쪽이 더 확실한 담당이다.
    .sort((a, b) => b.matched.length - a.matched.length);

  const unmatched = routes.length === 0;
  const cautioned = routes.filter((route) => route.caution);

  const body = unmatched
    ? [
        "담당할 AI 직원을 찾지 못했습니다.",
        "등록된 담당 키워드와 겹치는 부분이 없어 임의로 배분하지 않았습니다. 대표 판단이 필요합니다.",
        "",
        `요청: ${text}`,
      ].join("\n")
    : [
        `요청: ${text}`,
        "",
        "담당 배분:",
        ...routes.map(
          (route) =>
            `- ${route.agent} (${route.status}) → ${route.module} · 매칭 키워드: ${route.matched.join(", ")}`
        ),
        cautioned.length > 0
          ? `\n※ ${cautioned.map((route) => route.agent).join(", ")}는 정규직이 아닙니다(AI-STAFF-POLICY §1). 산출물을 그대로 쓰지 말고 검수하세요.`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

  return {
    task: text,
    routes,
    unmatched,
    envelope: {
      id: `task:${taskId ?? "unassigned"}`,
      origin: "부서요청",
      priority: unmatched ? "중요" : "일반",
      audience: unmatched ? "대표" : "본사",
      subject: unmatched
        ? "[배분 실패] 담당 AI 직원 미지정"
        : `[배분] ${routes[0].agent}${routes.length > 1 ? ` 외 ${routes.length - 1}명` : ""}`,
      body,
      source: "lib/hermes/directory.ts + AI_STAFF(AI-STAFF-POLICY.md §7)",
    },
  };
}
