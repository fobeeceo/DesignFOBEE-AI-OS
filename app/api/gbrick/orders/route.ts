export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { MEMBER_COOKIE, verifyMemberSession } from "@/lib/gbrick/member";
import { sbOrderRepo, sbMenuRepo, findStoreStrict, getDefaultOptions, countOrdersSince, findMember } from "@/lib/gbrick/repositories/supabase";
import { isLaunchStore, NOT_LAUNCHED_MESSAGE } from "@/lib/gbrick/launch";
import { isWithinOperatingHours, todayHoursLabel } from "@/lib/gbrick/storeHours";
import { priceOrderItems, cleanGuestText, type PriceableMenu } from "@/lib/gbrick/orderPricing";

// 한 매장에 10분 동안 이 수를 넘는 주문이 들어오면 잠시 막는다 (잘못된 반복 요청으로 주방 프린터가 도는 것을 막기 위함)
const MAX_ORDERS_PER_10_MIN = 40;

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GB${date}${rand}`;
}

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

  const storeId = body.storeId;
  if (typeof storeId !== "string" || !storeId) return reject("매장을 선택해 주세요", 400);
  if (!isLaunchStore(storeId)) return reject(NOT_LAUNCHED_MESSAGE, 403);

  try {
    const store = await findStoreStrict(storeId);
    if (!store) return reject("매장을 찾을 수 없습니다", 404);
    if (store.status !== "ACTIVE") return reject("지금은 주문을 받지 않습니다 (영업 준비중)", 409);
    if (!isWithinOperatingHours(store.operatingHours)) {
      const hours = todayHoursLabel(store.operatingHours);
      return reject(`지금은 영업시간이 아니라 주문할 수 없어요${hours ? ` (오늘 ${hours})` : ""}`, 409);
    }

    if (await countOrdersSince(storeId, new Date(Date.now() - 10 * 60_000).toISOString()) >= MAX_ORDERS_PER_10_MIN) {
      return reject("지금 주문이 많이 몰려 있어요. 잠시 후 다시 시도해 주세요", 429);
    }

    const [categories, defaultOptions] = await Promise.all([sbMenuRepo.findCategories(storeId), getDefaultOptions()]);
    const menus = categories.flatMap(c => c.menus) as unknown as PriceableMenu[];
    const priced = priceOrderItems(body.items, menus, defaultOptions);
    if (!priced.ok) return reject(priced.error, 400);

    // 로그인한 회원이면 주문을 회원에게 연결한다. 쿠키가 낡았거나 탈퇴한 회원이면 비회원 주문으로 받는다.
    const cookieMemberId = await verifyMemberSession(req.cookies.get(MEMBER_COOKIE)?.value);
    const memberId = cookieMemberId && (await findMember(cookieMemberId))?.isActive ? cookieMemberId : null;

    const order = await sbOrderRepo.create({
      orderNumber: generateOrderNumber(),
      storeId,
      customerId: memberId ?? undefined,
      isGuest: !memberId,
      items: priced.items,
      pickupName: cleanGuestText(body.pickupName, 20),
      note: cleanGuestText(body.note, 100),
      totalAmount: priced.totalAmount,
      finalAmount: priced.totalAmount,
      pointEarned: 0,
      pointUsed: 0,
      couponDiscount: 0,
      couponIssueId: undefined,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    // 주문이 실제로 저장되지 않았는데 성공처럼 보이게 하지 않는다 — 손님도 매장도 같은 사실을 보게 한다
    console.error("[POST /api/gbrick/orders] 주문 저장 실패:", err instanceof Error ? err.message : JSON.stringify(err));
    return reject("주문을 접수하지 못했어요. 잠시 후 다시 시도하거나 매장에 말씀해 주세요.", 500);
  }
}
