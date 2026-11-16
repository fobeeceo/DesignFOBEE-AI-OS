export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { cancelUnfinishedOrdersBefore, deleteExpiredPushSubscriptions } from "@/lib/gbrick/repositories/supabase";
import { kstDayStartIso } from "@/lib/gbrick/utils/time";

// GET /api/gbrick/cron/close-day — 매일 00:05 KST (vercel.json crons)
// 오늘(KST) 0시 이전에 들어와 아직 끝나지 않은 주문을 취소 처리한다.
// 입력값이 없고 여러 번 실행해도 결과가 같다. CRON_SECRET 이 설정돼 있으면 그 값만 허용한다.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const before = kstDayStartIso();
    const cancelled = await cancelUnfinishedOrdersBefore(before, "영업일 종료 자동 취소");
    await deleteExpiredPushSubscriptions().catch(err => console.error("[close-day] push cleanup", err));
    return NextResponse.json({ ok: true, before, cancelled });
  } catch (err) {
    console.error("[GET /api/gbrick/cron/close-day]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
