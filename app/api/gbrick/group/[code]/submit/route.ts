export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { MEMBER_COOKIE, verifyMemberSession } from "@/lib/gbrick/member";
import { findMember } from "@/lib/gbrick/repositories/supabase";
import { isRoomCode } from "@/lib/gbrick/groupOrder";
import { submitRoom } from "@/lib/gbrick/groupService";

/** POST /api/gbrick/group/:code/submit — 방장이 모두의 메뉴를 한 번에 주문한다 (결제는 픽업할 때 매장에서). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!isRoomCode(code)) return NextResponse.json({ error: "함께오더를 찾을 수 없어요" }, { status: 404 });
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* 빈 본문은 방장 확인에서 거절 */ }
  try {
    const cookieMemberId = await verifyMemberSession(req.cookies.get(MEMBER_COOKIE)?.value);
    const memberId = cookieMemberId && (await findMember(cookieMemberId))?.isActive ? cookieMemberId : null;
    const r = await submitRoom(code, body, memberId);
    if (!r.ok) return NextResponse.json({ error: r.error, ...("orderId" in r && r.orderId ? { orderId: r.orderId } : {}) }, { status: r.status });
    return NextResponse.json({ order: r.order }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/gbrick/group/:code/submit] 주문 저장 실패:", err instanceof Error ? err.message : JSON.stringify(err));
    return NextResponse.json({ error: "주문을 접수하지 못했어요. 잠시 후 다시 시도하거나 매장에 말씀해 주세요." }, { status: 500 });
  }
}
