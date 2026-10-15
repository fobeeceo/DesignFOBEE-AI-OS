import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { refineDesignSchema } from "@/lib/validations/design.schema";
import { refineDesignImage } from "@/services/designService";
import { InteriorDesignError } from "@/agents/interiorDesignAgent";

interface RouteParams {
  params: { projectId: string; designImageId: string };
}

/**
 * POST /api/projects/[projectId]/design/[designImageId]/refine
 * 대화형 리파인: 이미 생성된 결과 이미지에 사용자의 자연어 지시를 한 번 더 반영한다.
 * generate와 동일한 무료 횟수 한도를 소진한다.
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
    const parsed = refineDesignSchema.parse(body);

    const result = await refineDesignImage({
      userId: user.id,
      projectId: params.projectId,
      designImageId: params.designImageId,
      instruction: parsed.instruction,
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message ?? "입력값이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (error instanceof InteriorDesignError) {
      const status = error.code === "FREE_LIMIT_EXCEEDED" ? 403 : 400;
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
    }

    console.error("[POST /api/projects/[projectId]/design/[designImageId]/refine]", error);
    return NextResponse.json({ success: false, error: "AI 리파인 중 오류가 발생했습니다." }, { status: 500 });
  }
}
