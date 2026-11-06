import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checklistRepo, noticeRepo } from "@/lib/gbrick/repositories";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId 필요" }, { status: 400 });

    const checklists = await checklistRepo.findByStore(storeId);
    return NextResponse.json({ checklists, mock: IS_MOCK_MODE });
  } catch (err) {
    console.error("[GET /api/gbrick/store/checklists]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const body = await req.json();
    const { checklistId, completedByName, itemsChecked, notes } = body;
    if (!checklistId || !itemsChecked) {
      return NextResponse.json({ error: "checklistId와 itemsChecked 필요" }, { status: 400 });
    }

    const log = await checklistRepo.completeChecklist(checklistId, user.id, completedByName ?? "직원", itemsChecked, notes);
    return NextResponse.json({ log, mock: IS_MOCK_MODE }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/gbrick/store/checklists]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
