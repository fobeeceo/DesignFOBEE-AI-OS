import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { estimateInputSchema } from "@/lib/validations/estimate.schema";
import { createEstimate } from "@/services/estimateService";
import { InteriorDesignError } from "@/agents/interiorDesignAgent";

interface RouteParams {
  params: { projectId: string; designImageId: string };
}

/**
 * POST /api/projects/[projectId]/design/[designImageId]/estimate
 * STEP 7: 사용자가 입력한 면적 기준으로 AI 예상 견적을 계산한다.
 * ⚠️ 단가는 prompts/pricing.ts의 임시값 — 실제 배포 전 반드시 교체 필요.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = estimateInputSchema.parse(body);

    const estimate = await createEstimate({
      userId: user.id,
      projectId: params.projectId,
      designImageId: params.designImageId,
      areaSqm: parsed.areaSqm,
    });

    return NextResponse.json({ success: true, estimate }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message ?? "입력값이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (error instanceof InteriorDesignError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 400 });
    }

    console.error("[POST /api/projects/[projectId]/design/[designImageId]/estimate]", error);
    return NextResponse.json({ success: false, error: "견적 계산 중 오류가 발생했습니다." }, { status: 500 });
  }
}
