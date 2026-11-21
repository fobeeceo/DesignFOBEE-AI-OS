export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createRoom } from "@/lib/gbrick/groupService";

/** POST /api/gbrick/group — 함께오더 방 만들기. 응답의 hostSecret 은 방장만 알고 있어야 한다 (방장 주문 권한). */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* 본문 없이 와도 매장이 없으면 아래에서 거절 */ }
  try {
    const r = await createRoom(body.storeId, body.hostName);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json({ code: r.code, hostSecret: r.hostSecret, hostName: r.hostName, storeName: r.storeName }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/gbrick/group]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "함께오더를 만들지 못했어요. 잠시 후 다시 시도해 주세요" }, { status: 500 });
  }
}
