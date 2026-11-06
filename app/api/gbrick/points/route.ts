export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPointAccount, getPointHistory } from "@/lib/gbrick/services/pointService";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const [account, ledgers] = await Promise.all([
      getPointAccount(user.id),
      getPointHistory(user.id, 20),
    ]);

    return NextResponse.json({ account, ledgers, mock: IS_MOCK_MODE });
  } catch (err) {
    console.error("[GET /api/gbrick/points]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
