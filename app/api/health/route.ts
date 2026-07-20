import { NextResponse } from "next/server";

/**
 * GET /api/health
 * 배포 헬스체크용 엔드포인트 (Vercel 배포 검증 등)
 */
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
