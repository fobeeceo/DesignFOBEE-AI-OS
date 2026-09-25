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
  todayCount: number;
  monthCount: number;
  totalCount: number;
  estimatedCostTodayUsd: number;
  estimatedCostMonthUsd: number;
  estimatedCostTotalUsd: number;
  costPerImageUsd: number;
  /** STEP 4~5(첫 생성) + 대화형 리파인을 합쳐 무료 한도(3회)를 모두 소진한 사용자 수. */
  usersAtFreeLimit: number;
}

/**
 * AI 렌더링(생성+리파인) 사용량을 design_generations 테이블에서 실시간 집계한다.
 * 하드코딩 금지 원칙(§0-2 원칙5) — 건수는 항상 DB에서 그때그때 계산한다.
 */
export async function getAiUsageSummary(): Promise<AiUsageSummary> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayCount, monthCount, totalCount, perUserCounts] = await Promise.all([
    prisma.designGeneration.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.designGeneration.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.designGeneration.count(),
    prisma.designGeneration.groupBy({
      by: ["profileId"],
      _count: { profileId: true },
    }),
  ]);

  const usersAtFreeLimit = perUserCounts.filter(
    (row) => row._count.profileId >= FREE_GENERATIONS_PER_USER
  ).length;

  return {
    todayCount,
    monthCount,
    totalCount,
    estimatedCostTodayUsd: todayCount * ESTIMATED_COST_PER_IMAGE_USD,
    estimatedCostMonthUsd: monthCount * ESTIMATED_COST_PER_IMAGE_USD,
    estimatedCostTotalUsd: totalCount * ESTIMATED_COST_PER_IMAGE_USD,
    costPerImageUsd: ESTIMATED_COST_PER_IMAGE_USD,
    usersAtFreeLimit,
  };
}
