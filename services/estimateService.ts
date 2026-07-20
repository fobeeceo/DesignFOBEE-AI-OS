import { prisma } from "@/lib/prisma";
import { calculateEstimateRange } from "@/prompts/pricing";
import { InteriorDesignError } from "@/agents/interiorDesignAgent";
import type { Estimate } from "@/types/estimate";

function serializeEstimate(e: any): Estimate {
  return { ...e, createdAt: e.createdAt.toISOString() };
}

interface CreateEstimateParams {
  userId: string;
  projectId: string;
  designImageId: string;
  areaSqm: number;
}

/**
 * STEP 7: AI 예상 견적 생성.
 * 실제 견적 산정 로직이 아니라 prompts/pricing.ts의 임시 단가 기반 참고용 계산이다.
 * (단가 자체는 디자인포비 실제 시공 단가로 교체되어야 한다 — pricing.ts 상단 경고 참고)
 */
export async function createEstimate(params: CreateEstimateParams): Promise<Estimate> {
  const designImage = await prisma.designImage.findFirst({
    where: { id: params.designImageId, projectId: params.projectId, project: { profileId: params.userId } },
  });

  if (!designImage) {
    throw new InteriorDesignError("결과 이미지를 찾을 수 없습니다.", "DESIGN_IMAGE_NOT_FOUND");
  }

  const { pricePerSqm, minPrice, maxPrice } = calculateEstimateRange(
    params.areaSqm,
    designImage.roomType,
    designImage.style
  );

  const [estimate] = await prisma.$transaction([
    prisma.estimate.upsert({
      where: { designImageId: params.designImageId },
      update: { areaSqm: params.areaSqm, pricePerSqm, minPrice, maxPrice },
      create: {
        designImageId: params.designImageId,
        areaSqm: params.areaSqm,
        pricePerSqm,
        minPrice,
        maxPrice,
      },
    }),
    prisma.project.update({ where: { id: params.projectId }, data: { status: "ESTIMATED" } }),
  ]);

  return serializeEstimate(estimate);
}
