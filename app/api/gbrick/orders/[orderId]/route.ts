import { NextRequest, NextResponse } from "next/server";
import { IS_MOCK_MODE, MOCK_RECENT_ORDERS } from "@/lib/gbrick/mockData";
import { orderRepo } from "@/lib/gbrick/repositories";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    if (IS_MOCK_MODE) {
      const mockOrder = MOCK_RECENT_ORDERS.find((o) => o.id === params.orderId);
      if (!mockOrder) {
        return NextResponse.json({ error: "주문 없음" }, { status: 404 });
      }
      return NextResponse.json({
        order: {
          ...mockOrder,
          orderNumber: mockOrder.orderNumber,
          pickupName: mockOrder.pickupName,
          finalAmount: mockOrder.finalAmount,
          pointsEarned: Math.floor(mockOrder.finalAmount * 0.03),
          items: mockOrder.items.map((item) => ({ ...item, unitPrice: Math.floor(mockOrder.finalAmount / item.quantity) })),
        },
        mock: true,
      });
    }

    const order = await orderRepo.findById(params.orderId);
    if (!order) return NextResponse.json({ error: "주문 없음" }, { status: 404 });

    return NextResponse.json({ order });
  } catch (err) {
    console.error(`[GET /api/gbrick/orders/${params.orderId}]`, err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
