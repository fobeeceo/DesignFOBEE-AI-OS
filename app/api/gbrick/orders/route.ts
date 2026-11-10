export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sbOrderRepo } from "@/lib/gbrick/repositories/supabase";
import { MOCK_RECENT_ORDERS } from "@/lib/gbrick/mockData";

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GB${date}${rand}`;
}

export async function GET(_req: NextRequest) {
  return NextResponse.json({ orders: MOCK_RECENT_ORDERS, mock: true });
}

export async function POST(req: NextRequest) {
  let body: { storeId?: string; items?: { menuId: string; menuName: string; unitPrice: number; quantity: number; options?: { menuOptionId: string; optionName: string; extraPrice: number }[] }[]; pickupName?: string; note?: string; pointUsed?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const { storeId, items, pickupName, note, pointUsed = 0 } = body;
  if (!storeId || !items?.length) {
    return NextResponse.json({ error: "storeId와 items는 필수입니다" }, { status: 400 });
  }

  const totalAmount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const finalAmount = Math.max(0, totalAmount - pointUsed);

  try {
    const order = await sbOrderRepo.create({
      orderNumber: generateOrderNumber(),
      storeId,
      customerId: undefined,
      isGuest: true,
      items,
      pickupName: pickupName ?? undefined,
      note: note ?? undefined,
      totalAmount,
      finalAmount,
      pointEarned: Math.floor(finalAmount * 0.02),
      pointUsed,
      couponDiscount: 0,
      couponIssueId: undefined,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "서버 오류";
    console.error("[POST /api/gbrick/orders]", err);

    // gb_orders 테이블 미생성 시 mock 주문 반환 (고객이 오류를 보지 않도록)
    const isMissingTable = message.includes("does not exist") || message.includes("relation") || message.includes("GBRICK Supabase");
    if (isMissingTable) {
      return NextResponse.json({
        order: {
          id: `ord_${Date.now()}`,
          orderNumber: `GB${Date.now().toString().slice(-10)}`,
          storeId,
          status: "PENDING",
          finalAmount,
          pickupName: pickupName ?? "손님",
          items,
          createdAt: new Date().toISOString(),
          mock: true,
        },
        _warn: "gb_orders 테이블 미생성 — Supabase에서 SQL 실행 필요",
      }, { status: 201 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
