import { prisma } from "@/lib/prisma";
import type {
  Lead,
  LeadDetail,
  LeadListResult,
  LeadNote,
  LeadStatus,
} from "@/types/lead";

const PAGE_SIZE = 20;

function serializeLead(lead: any): Lead {
  return {
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

function serializeNote(note: any): LeadNote {
  return {
    id: note.id,
    leadId: note.leadId,
    authorId: note.authorId ?? null,
    authorName: note.author?.name ?? null,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
  };
}

interface ListLeadsParams {
  status?: LeadStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

/**
 * STEP 9: 관리자 리드 목록 조회. 상태 필터·검색어(이름/전화/이메일)·페이지네이션을 지원한다.
 */
export async function listLeads(params: ListLeadsParams): Promise<LeadListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? PAGE_SIZE;

  const where: any = {};
  if (params.status) {
    where.status = params.status;
  }
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { phone: { contains: params.q } },
      { email: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    leads: rows.map((lead: any) => ({
      ...serializeLead(lead),
      hasDesignImage: Boolean(lead.designImageId),
    })),
    total,
    page,
    pageSize,
  };
}

/**
 * STEP 9: 리드 상세 조회. 첨부된 AI 디자인 결과(이미지+설명+견적)와 상담 메모 이력을 함께 반환한다.
 */
export async function getLeadDetail(leadId: string): Promise<LeadDetail | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      designImage: { include: { estimate: true } },
      notes: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lead) {
    return null;
  }

  const { designImage, notes, ...rest } = lead as any;

  return {
    ...serializeLead(rest),
    designImageSummary: designImage
      ? {
          id: designImage.id,
          url: designImage.url,
          roomType: designImage.roomType,
          style: designImage.style,
          description: designImage.description,
          estimate: designImage.estimate
            ? {
                areaSqm: designImage.estimate.areaSqm,
                pricePerSqm: designImage.estimate.pricePerSqm,
                minPrice: designImage.estimate.minPrice,
                maxPrice: designImage.estimate.maxPrice,
              }
            : null,
        }
      : null,
    notes: notes.map(serializeNote),
  };
}

/**
 * STEP 9: 리드 상태를 변경한다 (NEW → CONTACTED → CONVERTED/CLOSED).
 */
export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<Lead> {
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: { status },
  });

  return serializeLead(lead);
}

/**
 * STEP 9: 리드에 상담 메모/통화 이력을 남긴다. 이 기록이 쌓이는 것이 "CRM 저장"의 핵심이다.
 */
export async function addLeadNote(
  leadId: string,
  authorId: string,
  content: string
): Promise<LeadNote> {
  const note = await prisma.leadNote.create({
    data: { leadId, authorId, content },
    include: { author: { select: { name: true } } },
  });

  return serializeNote(note);
}
