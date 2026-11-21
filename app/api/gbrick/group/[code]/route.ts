export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { isRoomCode } from "@/lib/gbrick/groupOrder";
import { getRoomView } from "@/lib/gbrick/groupService";

/** GET /api/gbrick/group/:code — 방 현황 (참여자·담은 메뉴·합계). 링크를 아는 사람만 볼 수 있고, 비밀값은 들어 있지 않다. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!isRoomCode(code)) return NextResponse.json({ error: "함께오더를 찾을 수 없어요" }, { status: 404 });
  try {
    const r = await getRoomView(code);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json({ room: r.room });
  } catch (err) {
    console.error("[GET /api/gbrick/group/:code]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "불러오지 못했어요. 잠시 후 다시 시도해 주세요" }, { status: 500 });
  }
}
