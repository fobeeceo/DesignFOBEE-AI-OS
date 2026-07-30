import { prisma } from "@/lib/prisma";
import { InteriorDesignError } from "@/agents/interiorDesignAgent";
import type { CreateLeadInput, Lead } from "@/types/lead";

function serializeLead(lead: any): Lead {
  return {
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

/**
 * 상담 신청(Lead) 생성 비즈니스 로직.
 * API 라우트는 이 서비스만 호출하고, DB 세부 구현은 여기에 캡슐화한다.
 * (원칙: 모든 API는 분리, 비즈니스 로직은 services/에 격리)
 *
 * STEP 8: designImageId가 있으면 "이 AI 디자인 결과로 상담 신청"한 것으로 보고,
 * 1) Lead에 해당 DesignImage를 연결하고
 * 2) 소유자 확인 후 연결된 Project.status를 CONSULTED로 갱신한다.
 * (일반 홈페이지 상담 폼은 designImageId 없이 그대로 동작 — 기존 STEP 1 동작 유지)
 */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const baseData = {
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    message: input.message || null,
    source: input.source,
    profileId: input.profileId || null,
    preferredRegion: input.preferredRegion || null,
    plannedTiming: input.plannedTiming || null,
    expectedInvestment: input.expectedInvestment || null,
    currentOccupation: input.currentOccupation || null,
    hasStorefront: input.hasStorefront ?? null,
    consultationPurpose: input.consultationPurpose || null,
    privacyConsent: input.privacyConsent ?? false,
  };

  if (input.designImageId) {
    const designImage = await prisma.designImage.findFirst({
      where: input.profileId
        ? { id: input.designImageId, project: { profileId: input.profileId } }
        : { id: input.designImageId },
      select: { id: true, projectId: true },
    });

    if (!designImage) {
      throw new InteriorDesignError("연결할 디자인 결과를 찾을 수 없습니다.", "DESIGN_IMAGE_NOT_FOUND");
    }

    const [lead] = await prisma.$transaction([
      prisma.lead.create({ data: { ...baseData, designImageId: designImage.id } }),
      prisma.project.update({ where: { id: designImage.projectId }, data: { status: "CONSULTED" } }),
    ]);

    return serializeLead(lead);
  }

  const lead = await prisma.lead.create({ data: baseData });

  return serializeLead(lead);
}
