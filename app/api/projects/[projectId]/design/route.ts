import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateDesignSchema } from "@/lib/validations/design.schema";
import { generateDesignForProject, getRemainingFreeGenerations } from "@/services/designService";
import { InteriorDesignError } from "@/agents/interiorDesignAgent";

/**
 * POST /api/projects/[projectId]/design
 * STEP 4(공간유형 선택) + STEP 5(AI 이미지 생성)을 한 번에 처리한다.
 * 로그인 사용자별 무료 횟수를 소진하면 상담 유도 메시지와 함께 차단된다.
 */
export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
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
    const parsed = generateDesignSchema.parse(body);

    const result = await generateDesignForProject({
      userId: user.id,
      projectId: params.projectId,
      sourcePhotoId: parsed.sourcePhotoId,
      roomTypeId: parsed.roomTypeId,
      styleId: parsed.styleId,
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

    console.error("[POST /api/projects/[projectId]/design]", error);
    return NextResponse.json({ success: false, error: "AI 디자인 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

/**
 * GET /api/projects/[projectId]/design
 * 로그인 사용자의 남은 무료 생성 횟수를 조회한다 (화면 상단 배지용).
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  const remaining = await getRemainingFreeGenerations(user.id);
  return NextResponse.json({ success: true, remaining });
}
