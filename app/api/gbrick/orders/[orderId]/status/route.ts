export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { GbOrderStatus } from "@prisma/client";
import { sbOrderRepo } from "@/lib/gbrick/repositories/supabase";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:   ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY:     ["PICKED_UP"],
  PICKED_UP: [],
  CANCELLED: [],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { status, note } = await req.json() as { status: string; note?: string };

    const order = await sbOrderRepo.findById(orderId);
    if (!order) return NextResponse.json({ error: "주문 없음" }, { status: 404 });

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `${order.status} → ${status} 전환 불가` }, { status: 400 });
    }

    const updated = await sbOrderRepo.updateStatus(orderId, status as GbOrderStatus, "store_staff", note);
    return NextResponse.json({ ok: true, order: updated });
  } catch (err) {
    console.error("[PATCH /api/gbrick/orders/status]", err);
    return NextResponse.json({ error: "서버 오류", detail: String(err) }, { status: 500 });
  }
}
