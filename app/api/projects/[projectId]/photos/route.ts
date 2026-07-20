import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjectForUser } from "@/services/projectService";
import { addPhotoToProject } from "@/services/photoService";

interface RouteParams {
  params: { projectId: string };
}

/**
 * POST /api/projects/[projectId]/photos
 * multipart/form-data (field: "file") 로 사진 한 장을 업로드한다. (STEP 3)
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

    const project = await getProjectForUser(params.projectId, user.id);
    if (!project) {
      return NextResponse.json({ success: false, error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "파일이 전달되지 않았습니다." }, { status: 400 });
    }

    const photo = await addPhotoToProject({ userId: user.id, projectId: params.projectId, file });

    return NextResponse.json({ success: true, photo }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects/[projectId]/photos]", error);
    const message = error instanceof Error ? error.message : "사진 업로드 중 오류가 발생했습니다.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/**
 * GET /api/projects/[projectId]/photos
 * 프로젝트의 업로드된 사진 목록을 조회한다.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  const project = await getProjectForUser(params.projectId, user.id);
  if (!project) {
    return NextResponse.json({ success: false, error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ success: true, photos: project.photos });
}
