import { prisma } from "@/lib/prisma";
import { FREE_GENERATIONS_PER_USER } from "@/prompts/interiorStyles";

/**
 * gemini-3.1-flash-image-preview 1024px 출력 기준 이미지 1장당 단가(USD).
 * 출처: Google 공식 가격표(ai.google.dev/gemini-api/docs/pricing) 재게시 자료 확인, 2026-09 기준값 — 원칙 3(추정치임을 먼저 밝힘).
 * Google이 가격을 바꾸면 이 값도 갱신해야 한다. 정확한 실시간 단가는 공식 페이지에서 재확인할 것.
 * 실제 청구액과 다를 수 있어 "예상" 비용으로만 표시한다(원칙 2 — 확인 안 된 걸 확정값으로 내지 않는다).
 */
const ESTIMATED_COST_PER_IMAGE_USD = Number(process.env.GEMINI_IMAGE_COST_USD_PER_IMAGE ?? 0.067);

export interface AiUsageSummary {
  /** 실제 고객이 쓰는 /design(로그인 없음) 기준 — 우리 Gemini 키(demo mode)로 발생한 건수만. BYOK(고객 본인 키)는 제외. */
  publicToday: number;
  publicMonth: number;
  publicTotal: number;
  publicEstimatedCostTodayUsd: number;
  publicEstimatedCostMonthUsd: number;
  publicEstimatedCostTotalUsd: number;
  costPerImageUsd: number;
  /** 참고용 — 로그인 기반 /analyze/[projectId] 플로우(현재 사실상 미사용). */
  legacyLoginFlowTotal: number;
  legacyUsersAtFreeLimit: number;
}

/**
 * AI 렌더링 사용량을 실시간 집계한다(하드코딩 금지, §0-2 원칙5).
 * 실제 고객 화면(/design)은 public_generations 테이블, 로그인 기반 화면(/analyze)은
 * design_generations 테이블에 각각 기록되므로 반드시 둘 다 조회해 어느 쪽 숫자인지 밝힌다.
 */
export async function getAiUsageSummary(): Promise<AiUsageSummary> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // demo mode(byok=false)만 우리 Gemini 키 비용에 잡힌다.
  const demoWhere = { byok: false } as const;

  const [publicToday, publicMonth, publicTotal, legacyLoginFlowTotal, perUserCounts] = await Promise.all([
    prisma.publicGeneration.count({ where: { ...demoWhere, createdAt: { gte: startOfToday } } }),
    prisma.publicGeneration.count({ where: { ...demoWhere, createdAt: { gte: startOfMonth } } }),
    prisma.publicGeneration.count({ where: demoWhere }),
    prisma.designGeneration.count(),
    prisma.designGeneration.groupBy({ by: ["profileId"], _count: { profileId: true } }),
  ]);

  const legacyUsersAtFreeLimit = perUserCounts.filter(
    (row) => row._count.profileId >= FREE_GENERATIONS_PER_USER
  ).length;

  return {
    publicToday,
    publicMonth,
    publicTotal,
    publicEstimatedCostTodayUsd: publicToday * ESTIMATED_COST_PER_IMAGE_USD,
    publicEstimatedCostMonthUsd: publicMonth * ESTIMATED_COST_PER_IMAGE_USD,
    publicEstimatedCostTotalUsd: publicTotal * ESTIMATED_COST_PER_IMAGE_USD,
    costPerImageUsd: ESTIMATED_COST_PER_IMAGE_USD,
    legacyLoginFlowTotal,
    legacyUsersAtFreeLimit,
  };
}
