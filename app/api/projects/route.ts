import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "@/services/projectService";
import { deriveProvider } from "@/lib/auth/deriveProvider";

/**
 * POST /api/projects
 * 로그인한 사용자의 새 사진 업로드 세션(Project)을 생성한다. (STEP 3)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const project = await createProject(
      {
        id: user.id,
        name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? user.email ?? "회원",
        provider: deriveProvider(user.app_metadata?.provider),
      },
      body?.title
    );

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects]", error);
    return NextResponse.json({ success: false, error: "프로젝트 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
