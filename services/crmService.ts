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
      // STEP 11: 전화 상담 중 접수번호(GBR-YYYYMMDD-NNNN)로 바로 찾을 수 있게 한다.
      { referenceNo: { contains: params.q, mode: "insensitive" } },
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

/**
 * STEP 11: 관리자가 AI 상담 요약 영역(상담 요약·다음 액션·AI 메모)을 저장한다.
 * AI가 만든 초안을 사람이 확인·수정하는 것을 전제로 하며, 보낸 필드만 갱신한다.
 */
export async function updateLeadAiMemo(
  leadId: string,
  input: { aiSummary?: string; nextAction?: string; aiMemo?: string }
): Promise<Lead> {
  const data: Record<string, string | null> = {};
  if (input.aiSummary !== undefined) data.aiSummary = input.aiSummary.trim() || null;
  if (input.nextAction !== undefined) data.nextAction = input.nextAction.trim() || null;
  if (input.aiMemo !== undefined) data.aiMemo = input.aiMemo.trim() || null;

  const lead = await prisma.lead.update({ where: { id: leadId }, data });

  return serializeLead(lead);
}

export interface LeadStats {
  totalThisMonth: number;
  totalAllTime: number;
  convertedAllTime: number;
  /** 전환율(%) — 전체 리드 대비 CONVERTED 비율, 소수 첫째 자리. */
  conversionRate: number;
  byRegion: { region: string; count: number }[];
  byTiming: { timing: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

/**
 * STEP 11: CEO Dashboard용 상담 집계.
 * 이번 달 상담 / 지역별 / 창업예정시기 / 우선순위 / 전환율을 한 번에 조회한다.
 * (Lead 테이블에 createdAt·source·priority·preferredRegion 인덱스를 두어 집계 비용을 낮췄다.)
 */
export async function getLeadStats(source?: string): Promise<LeadStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const where = source ? { source } : {};

  const [totalThisMonth, totalAllTime, convertedAllTime, regionRows, timingRows, priorityRows] =
    await prisma.$transaction([
      prisma.lead.count({ where: { ...where, createdAt: { gte: monthStart } } }),
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { ...where, status: "CONVERTED" } }),
      prisma.lead.groupBy({
        by: ["preferredRegion"],
        where,
        _count: { _all: true },
        orderBy: { preferredRegion: "asc" },
      }),
      prisma.lead.groupBy({
        by: ["plannedTiming"],
        where,
        _count: { _all: true },
        orderBy: { plannedTiming: "asc" },
      }),
      prisma.lead.groupBy({
        by: ["priority"],
        where,
        _count: { _all: true },
        orderBy: { priority: "asc" },
      }),
    ]);

  // groupBy 결과에서 값이 없는(null) 버킷은 빼고 건수 내림차순으로 정렬한다.
  const buckets = (rows: any[], key: string): { value: string; count: number }[] =>
    rows
      .filter((row) => row[key] != null)
      .map((row) => ({ value: String(row[key]), count: row._count._all }))
      .sort((a, b) => b.count - a.count);

  return {
    totalThisMonth,
    totalAllTime,
    convertedAllTime,
    conversionRate:
      totalAllTime === 0 ? 0 : Math.round((convertedAllTime / totalAllTime) * 1000) / 10,
    byRegion: buckets(regionRows, "preferredRegion").map(({ value, count }) => ({
      region: value,
      count,
    })),
    byTiming: buckets(timingRows, "plannedTiming").map(({ value, count }) => ({
      timing: value,
      count,
    })),
    byPriority: buckets(priorityRows, "priority").map(({ value, count }) => ({
      priority: value,
      count,
    })),
  };
}
