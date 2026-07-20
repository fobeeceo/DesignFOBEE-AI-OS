import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, AdminAuthError } from "@/lib/auth/requireAdmin";
import { leadNoteInputSchema } from "@/lib/validations/crm.schema";
import { addLeadNote } from "@/services/crmService";

interface RouteParams {
  params: { leadId: string };
}

/**
 * POST /api/admin/leads/[leadId]/notes
 * STEP 9: 리드에 상담 메모/통화 이력을 추가한다. (CRM 데이터 축적의 핵심 엔드포인트)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();

    const body = await req.json();
    const parsed = leadNoteInputSchema.parse(body);

    const note = await addLeadNote(params.leadId, admin.id, parsed.content);

    return NextResponse.json({ success: true, note }, { status: 201 });
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

    console.error("[POST /api/admin/leads/[leadId]/notes]", error);
    return NextResponse.json(
      { success: false, error: "메모 추가 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
