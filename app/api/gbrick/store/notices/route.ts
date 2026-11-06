export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { noticeRepo } from "@/lib/gbrick/repositories";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId") ?? "";

    const notices = await noticeRepo.findByStore(storeId);
    return NextResponse.json({ notices, mock: IS_MOCK_MODE });
  } catch (err) {
    console.error("[GET /api/gbrick/store/notices]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
