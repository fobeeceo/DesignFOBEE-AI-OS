export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/gbrick/push";

// GET /api/gbrick/push/key — 알림 구독에 쓰는 공개 키. 설정 전이면 null.
export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() }, { headers: { "Cache-Control": "no-store" } });
}
