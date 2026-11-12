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
    // Supabase errors are plain objects, not Error instances — extract message properly
    const message = err instanceof Error
      ? err.message
      : String((err as Record<string, unknown>)?.message ?? (err as Record<string, unknown>)?.details ?? "DB 오류");

    console.error("[POST /api/gbrick/orders] raw error:", JSON.stringify(err));
    console.error("[POST /api/gbrick/orders] DIAGNOSIS — message:", message);
    console.error("[POST /api/gbrick/orders] DIAGNOSIS — check Vercel env: NEXT_PUBLIC_GBRICK_SUPABASE_ANON_KEY or GBRICK_SUPABASE_SERVICE_ROLE_KEY must be set");

    // 테이블 미생성 / 키 미설정 / RLS 차단 / FK 오류 → mock 주문 반환 (흐름 테스트 가능)
    const useMock =
      message.includes("does not exist") ||
      message.includes("relation") ||
      message.includes("GBRICK Supabase") ||
      message.includes("security policy") ||
      message.includes("violates") ||
      message.includes("DB 오류");

    if (useMock) {
      console.warn("[POST /api/gbrick/orders] mock fallback:", message);
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
        _warn: message,
      }, { status: 201 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
