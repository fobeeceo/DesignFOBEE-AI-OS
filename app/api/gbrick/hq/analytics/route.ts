import { NextResponse } from "next/server";
import { IS_MOCK_MODE, MOCK_WEEKLY_REVENUE, MOCK_TOP_MENUS, MOCK_STORE_STATS } from "@/lib/gbrick/mockData";

export async function GET() {
  try {
    if (IS_MOCK_MODE) {
      return NextResponse.json({
        weeklyRevenue: MOCK_WEEKLY_REVENUE,
        topMenus: MOCK_TOP_MENUS,
        storeComparison: MOCK_STORE_STATS,
        mock: true,
      });
    }

    // TODO: aggregate from DB when connected
    return NextResponse.json({ error: "DB 미연결" }, { status: 503 });
  } catch (err) {
    console.error("[GET /api/gbrick/hq/analytics]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
