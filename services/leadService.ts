import { prisma } from "@/lib/prisma";
import { InteriorDesignError } from "@/agents/interiorDesignAgent";
import {
  diagnoseFit,
  classifyLead,
  calculatePriority,
  buildAiSummary,
  suggestNextAction,
  type FitDiagnosis,
} from "@/lib/franchise/leadIntelligence";
import { recommendCaseCodes } from "@/lib/franchise/successCases";
import { FRANCHISE_SOURCE } from "@/lib/franchise/constants";
import type { CreateLeadInput, Lead } from "@/types/lead";

/** 접수번호 접두사 — 관리자가 전화 상담 중 검색하는 키(GBR-YYYYMMDD-NNNN). */
const REFERENCE_PREFIX = "GBR";
const MAX_REFERENCE_ATTEMPTS = 5;

function formatReferenceNo(date: Date, sequence: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${REFERENCE_PREFIX}-${y}${m}${d}-${String(sequence).padStart(4, "0")}`;
}

/**
 * 당일 접수 건수 + 1로 접수번호를 만든다.
 * 동시 접수로 번호가 겹치면 DB unique 제약이 막아주므로, 호출부에서 재시도한다.
 */
async function nextReferenceNo(now: Date): Promise<string> {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setDate(startOfNextDay.getDate() + 1);

  const todayCount = await prisma.lead.count({
    where: { createdAt: { gte: startOfDay, lt: startOfNextDay } },
  });

  return formatReferenceNo(now, todayCount + 1);
}

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
  // STEP 11: 가맹상담 리드만 AI 분석을 적용한다(인테리어/AI디자인 상담은 신호가 없어 무의미).
  const isFranchise = input.source === FRANCHISE_SOURCE;
  let intelligence = {};

  if (isFranchise) {
    const signals = {
      consultationPurpose: input.consultationPurpose,
      preferredRegion: input.preferredRegion,
      plannedTiming: input.plannedTiming,
      expectedInvestment: input.expectedInvestment,
      currentOccupation: input.currentOccupation,
      hasStorefront: input.hasStorefront,
      message: input.message,
    };
    const fit = diagnoseFit(signals);
    const priority = calculatePriority(signals);
    const tags = classifyLead(signals);

    intelligence = {
      fitScore: fit.score,
      priority,
      tags,
      recommendedCases: recommendCaseCodes(tags),
      aiSummary: buildAiSummary(signals, fit, priority),
      nextAction: suggestNextAction(priority),
    };
  }

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
    attachments: input.attachments ?? [],
    ...intelligence,
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
      prisma.lead.create({
        data: {
          ...baseData,
          designImageId: designImage.id,
          referenceNo: await nextReferenceNo(new Date()),
        },
      }),
      prisma.project.update({ where: { id: designImage.projectId }, data: { status: "CONSULTED" } }),
    ]);

    return serializeLead(lead);
  }

  // 동시 접수로 접수번호가 겹치면(P2002) 다시 계산해 재시도한다.
  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt += 1) {
    try {
      const lead = await prisma.lead.create({
        data: { ...baseData, referenceNo: await nextReferenceNo(new Date()) },
      });

      return serializeLead(lead);
    } catch (error: any) {
      const isDuplicateReference =
        error?.code === "P2002" && String(error?.meta?.target ?? "").includes("referenceNo");

      if (!isDuplicateReference || attempt === MAX_REFERENCE_ATTEMPTS - 1) {
        throw error;
      }
    }
  }

  // 위 루프는 성공하거나 throw하므로 여기에 도달하지 않는다(타입 보장용).
  throw new Error("상담 접수번호 생성에 실패했습니다.");
}
