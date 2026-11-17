export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { sbMenuRepo, ensureDefaultOptionsTemplate } from "@/lib/gbrick/repositories/supabase";
import { DEFAULT_OPTIONS_MENU_ID } from "@/lib/gbrick/defaultOptions";

// POST /api/gbrick/admin/default-options — 기본 옵션 목록을 (없으면 만들어서) 돌려준다.
// 수정·추가·삭제는 이 menuId 로 기존 옵션 API(/admin/menus/:menuId/options)를 그대로 쓴다.
export async function POST() {
  try {
    await ensureDefaultOptionsTemplate();
    const options = await sbMenuRepo.findOptions(DEFAULT_OPTIONS_MENU_ID);
    return NextResponse.json({ menuId: DEFAULT_OPTIONS_MENU_ID, options }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[POST /api/gbrick/admin/default-options]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
