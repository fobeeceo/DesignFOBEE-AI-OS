import { NextResponse } from "next/server";
import { ERP_SNAPSHOT } from "@/lib/hq/erpSnapshot";

export const dynamic = "force-dynamic";

/**
 * AI HQ ERP 라이브 API.
 * 현재는 SSOT 스냅샷(erp_engine/pos_import 산출물)을 반환.
 * 추후: POS 업로드 저장소/DB를 읽어 실시간 계산 결과로 대체(스냅샷 형태 동일 유지).
 */
export async function GET() {
  return NextResponse.json({ ok: true, source: "snapshot", data: ERP_SNAPSHOT });
}
