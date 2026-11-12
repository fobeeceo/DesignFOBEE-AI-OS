import { NextRequest, NextResponse } from "next/server";
import { sbOrderRepo } from "@/lib/gbrick/repositories/supabase";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  // mock fallback: POST route returned ord_<timestamp> when Supabase was unavailable
  if (orderId.startsWith("ord_")) {
    return NextResponse.json({
      order: {
        id: orderId,
        orderNumber: `GB${orderId.replace("ord_", "")}`,
        storeId: "",
        status: "PENDING",
        pickupName: "손님",
        finalAmount: 0,
        pointsEarned: 0,
        createdAt: new Date().toISOString(),
        items: [],
        mock: true,
      },
    });
  }

  try {
    const raw = await sbOrderRepo.findById(orderId);
    if (!raw) return NextResponse.json({ error: "주문 없음" }, { status: 404 });

    const r = raw as unknown as Record<string, unknown>;
    const rawItems = (r.items as Record<string, unknown>[] | undefined) ?? [];

    const order = {
      id: r.id,
      orderNumber: r.orderNumber,
      storeId: r.storeId,
      status: r.status ?? "PENDING",
      pickupName: r.pickupName ?? "",
      finalAmount: r.finalAmount ?? 0,
      pointsEarned: Math.floor(((r.finalAmount as number) ?? 0) * 0.02),
      createdAt: r.createdAt,
      items: rawItems.map((item) => ({
        menuName: item.menuName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        optionName: (item.options as { optionName: string }[] | undefined)
          ?.map((o) => o.optionName)
          .join(" · ") || undefined,
      })),
    };

    return NextResponse.json({ order });
  } catch (err) {
    console.error(`[GET /api/gbrick/orders/${orderId}]`, err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
