export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { MEMBER_COOKIE, verifyMemberSession } from "@/lib/gbrick/member";
import { anonymizeMember, sbOrderRepo } from "@/lib/gbrick/repositories/supabase";

const IN_PROGRESS = ["PENDING", "CONFIRMED", "PREPARING", "READY"];

/** DELETE /api/gbrick/auth/delete-account — 회원 탈퇴 (이름 지우고 비활성화, 주문 기록은 남김) */
export async function DELETE(req: NextRequest) {
  const memberId = await verifyMemberSession(req.cookies.get(MEMBER_COOKIE)?.value);
  if (!memberId) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  try {
    const orders = await sbOrderRepo.findByCustomer(memberId, 50);
    if (orders.some(o => IN_PROGRESS.includes(o.status))) {
      return NextResponse.json({ error: "진행 중인 주문이 있어 탈퇴할 수 없어요. 픽업을 마친 뒤 다시 시도해 주세요." }, { status: 400 });
    }
    await anonymizeMember(memberId);
    const res = NextResponse.json({ deleted: true });
    res.cookies.delete(MEMBER_COOKIE);
    return res;
  } catch (err) {
    console.error("[DELETE /api/gbrick/auth/delete-account]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "탈퇴 처리 중 오류가 발생했어요" }, { status: 500 });
  }
}
