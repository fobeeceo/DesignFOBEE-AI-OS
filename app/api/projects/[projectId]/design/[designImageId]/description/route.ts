import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDescriptionForDesignImage } from "@/services/designService";
import { InteriorDesignError } from "@/agents/interiorDesignAgent";

interface RouteParams {
  params: { projectId: string; designImageId: string };
}

/**
 * POST /api/projects/[projectId]/design/[designImageId]/description
 * STEP 6: 이미 생성된 결과 이미지에 대한 AI 설명을 생성/저장한다.
 * 이미 설명이 있으면 재생성하지 않고 캐시된 값을 그대로 반환한다.
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

    const description = await generateDescriptionForDesignImage({
      userId: user.id,
      projectId: params.projectId,
      designImageId: params.designImageId,
    });

    return NextResponse.json({ success: true, description }, { status: 200 });
  } catch (error) {
    if (error instanceof InteriorDesignError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 400 });
    }

    console.error("[POST /api/projects/[projectId]/design/[designImageId]/description]", error);
    return NextResponse.json({ success: false, error: "AI 설명 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
