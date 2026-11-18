export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { MEMBER_COOKIE, verifyMemberSession } from "@/lib/gbrick/member";
import { findMember, sbPointRepo } from "@/lib/gbrick/repositories/supabase";

/** GET /api/gbrick/me — 로그인한 회원의 닉네임과 포인트. 로그인하지 않았으면 member: null (오류 아님) */
export async function GET(req: NextRequest) {
  const memberId = await verifyMemberSession(req.cookies.get(MEMBER_COOKIE)?.value);
  if (!memberId) return NextResponse.json({ member: null });
  try {
    const member = await findMember(memberId);
    if (!member?.isActive) {
      const res = NextResponse.json({ member: null });
      res.cookies.delete(MEMBER_COOKIE); // 탈퇴한 회원의 옛 쿠키
      return res;
    }
    const [account, ledgers] = await Promise.all([sbPointRepo.findOrCreateAccount(memberId), sbPointRepo.getLedgers(memberId, 20)]);
    return NextResponse.json({
      member: { id: member.id, nickname: member.nickname, provider: member.id.split("_")[0] },
      points: { balance: account.balance, totalEarned: account.totalEarned, totalUsed: account.totalUsed },
      ledgers,
    });
  } catch (err) {
    console.error("[GET /api/gbrick/me]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "회원 정보를 불러오지 못했어요" }, { status: 500 });
  }
}
