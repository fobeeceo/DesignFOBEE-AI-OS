import { NextResponse } from "next/server";
import { IS_MOCK_MODE, MOCK_HQ_STATS, MOCK_STORE_STATS, MOCK_RECENT_ORDERS, MOCK_TOP_MENUS, MOCK_WEEKLY_REVENUE } from "@/lib/gbrick/mockData";

export async function GET() {
  try {
    if (IS_MOCK_MODE) {
      return NextResponse.json({
        stats: MOCK_HQ_STATS,
        storeStats: MOCK_STORE_STATS,
        recentOrders: MOCK_RECENT_ORDERS,
        topMenus: MOCK_TOP_MENUS,
        weeklyRevenue: MOCK_WEEKLY_REVENUE,
        mock: true,
      });
    }

    // TODO: aggregate from DB
    return NextResponse.json({ error: "DB 미연결" }, { status: 503 });
  } catch (err) {
    console.error("[GET /api/gbrick/hq/dashboard]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
