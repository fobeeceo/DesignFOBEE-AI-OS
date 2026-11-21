export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { MEMBER_COOKIE, verifyMemberSession } from "@/lib/gbrick/member";
import { sbOrderRepo, findMember } from "@/lib/gbrick/repositories/supabase";
import { submitOrder } from "@/lib/gbrick/orderSubmit";

const reject = (error: string, status: number) => NextResponse.json({ error }, { status });

// 로그인한 회원의 실제 주문 내역. 로그인하지 않았으면 빈 목록 (샘플 주문을 만들어 보이지 않는다).
export async function GET(req: NextRequest) {
  const memberId = await verifyMemberSession(req.cookies.get(MEMBER_COOKIE)?.value);
  if (!memberId) return NextResponse.json({ orders: [], loggedIn: false });
  try {
    return NextResponse.json({ orders: await sbOrderRepo.findByCustomer(memberId, 30), loggedIn: true });
  } catch (err) {
    console.error("[GET /api/gbrick/orders]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "주문 내역을 불러오지 못했어요" }, { status: 500 });
  }
}

// 앱 결제 연결 전(소프트 런칭): 결제는 픽업할 때 매장에서 한다. 금액·옵션은 서버가 다시 계산하고, 포인트는 쓰지 않는다.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return reject("잘못된 요청 형식", 400);
  }

  try {
    // 로그인한 회원이면 주문을 회원에게 연결한다. 쿠키가 낡았거나 탈퇴한 회원이면 비회원 주문으로 받는다.
    const cookieMemberId = await verifyMemberSession(req.cookies.get(MEMBER_COOKIE)?.value);
    const memberId = cookieMemberId && (await findMember(cookieMemberId))?.isActive ? cookieMemberId : null;

    const result = await submitOrder({ storeId: body.storeId, items: body.items, pickupName: body.pickupName, note: body.note, memberId });
    if (!result.ok) return reject(result.error, result.status);
    const { order } = result;
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    // 주문이 실제로 저장되지 않았는데 성공처럼 보이게 하지 않는다 — 손님도 매장도 같은 사실을 보게 한다
    console.error("[POST /api/gbrick/orders] 주문 저장 실패:", err instanceof Error ? err.message : JSON.stringify(err));
    return reject("주문을 접수하지 못했어요. 잠시 후 다시 시도하거나 매장에 말씀해 주세요.", 500);
  }
}
