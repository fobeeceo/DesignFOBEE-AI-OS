import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, AdminAuthError } from "@/lib/auth/requireAdmin";
import { leadStatusUpdateSchema } from "@/lib/validations/crm.schema";
import { getLeadDetail, updateLeadStatus } from "@/services/crmService";

interface RouteParams {
  params: { leadId: string };
}

/**
 * GET /api/admin/leads/[leadId]
 * STEP 9: 리드 상세 조회 (첨부된 AI 디자인 결과 + 상담 메모 이력 포함).
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const lead = await getLeadDetail(params.leadId);
    if (!lead) {
      return NextResponse.json({ success: false, error: "리드를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      const status = error.code === "NOT_LOGGED_IN" ? 401 : 403;
      return NextResponse.json({ success: false, error: error.message }, { status });
    }

    console.error("[GET /api/admin/leads/[leadId]]", error);
    return NextResponse.json(
      { success: false, error: "리드 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/leads/[leadId]
 * STEP 9: 리드 상태 변경 (NEW → CONTACTED → CONVERTED/CLOSED).
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const body = await req.json();
    const parsed = leadStatusUpdateSchema.parse(body);

    const lead = await updateLeadStatus(params.leadId, parsed.status);

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      const status = error.code === "NOT_LOGGED_IN" ? 401 : 403;
      return NextResponse.json({ success: false, error: error.message }, { status });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message ?? "입력값이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    console.error("[PATCH /api/admin/leads/[leadId]]", error);
    return NextResponse.json(
      { success: false, error: "상태 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
