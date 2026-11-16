export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sbOrderRepo, savePushSubscription } from "@/lib/gbrick/repositories/supabase";
import { isAllowedPushEndpoint } from "@/lib/gbrick/push";

// POST /api/gbrick/orders/:orderId/push — 이 주문의 상태 알림을 받을 폰을 등록한다
export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const body = await req.json().catch(() => null) as
      { subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } } | null;
    const endpoint = body?.subscription?.endpoint;
    const p256dh = body?.subscription?.keys?.p256dh;
    const auth = body?.subscription?.keys?.auth;

    if (typeof endpoint !== "string" || typeof p256dh !== "string" || typeof auth !== "string"
      || endpoint.length > 1000 || p256dh.length > 200 || auth.length > 100
      || !isAllowedPushEndpoint(endpoint)) {
      return NextResponse.json({ error: "잘못된 구독 정보" }, { status: 400 });
    }

    const order = await sbOrderRepo.findById(orderId);
    if (!order) return NextResponse.json({ error: "주문 없음" }, { status: 404 });

    await savePushSubscription(orderId, { endpoint, p256dh, auth });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/gbrick/orders/push]", err);
    return NextResponse.json({ error: "알림 등록 실패" }, { status: 500 });
  }
}
