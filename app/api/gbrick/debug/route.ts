export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GBRICK_URL = "https://rzgrkrffksqdeztzxyrt.supabase.co";

export async function GET() {
  const key =
    process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_GBRICK_SUPABASE_ANON_KEY ??
    null;

  const keyPresent = !!key;
  const keyPrefix = key ? key.slice(0, 12) + "..." : "(없음)";
  const keyFormat = key?.startsWith("sb_se_") ? "new-secret"
    : key?.startsWith("sb_pu_") ? "new-publishable"
    : key?.startsWith("eyJ") ? "legacy-jwt"
    : "unknown";

  if (!key) {
    return NextResponse.json({
      ok: false,
      step: "key_check",
      error: "키 미설정 — GBRICK_SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_GBRICK_SUPABASE_ANON_KEY 필요",
      env: { keyPresent, keyPrefix },
    });
  }

  // 1) 단순 SELECT 테스트
  const sb = createClient(GBRICK_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: pingData, error: pingError } = await sb.from("gb_stores").select("id").limit(1);

  if (pingError) {
    return NextResponse.json({
      ok: false,
      step: "select_gb_stores",
      error: pingError.message,
      errorCode: (pingError as unknown as Record<string, unknown>).code,
      errorDetails: (pingError as unknown as Record<string, unknown>).details,
      env: { keyPresent, keyPrefix, keyFormat },
    });
  }

  // 2) gb_orders 테이블 존재 여부
  const { data: orderCheck, error: orderErr } = await sb.from("gb_orders").select("id").limit(1);

  if (orderErr) {
    return NextResponse.json({
      ok: false,
      step: "select_gb_orders",
      error: orderErr.message,
      errorCode: (orderErr as unknown as Record<string, unknown>).code,
      env: { keyPresent, keyPrefix, keyFormat },
      stores: pingData,
    });
  }

  // 3) INSERT 권한 테스트 (즉시 rollback — 실제로는 삽입 안 됨)
  const testId = `debug_${Date.now()}`;
  const { error: insertErr } = await sb.from("gb_orders").insert({
    id: testId,
    orderNumber: "DEBUG-TEST",
    storeId: "debug-store",
    status: "PENDING",
    totalAmount: 0,
    discountAmount: 0,
    finalAmount: 0,
    pointEarned: 0,
    pointUsed: 0,
    couponDiscount: 0,
    isGuest: true,
  });

  // 삽입 성공하면 바로 삭제
  if (!insertErr) {
    await sb.from("gb_orders").delete().eq("id", testId);
  }

  return NextResponse.json({
    ok: !insertErr,
    step: insertErr ? "insert_test_failed" : "all_pass",
    insertError: insertErr ? {
      message: insertErr.message,
      code: (insertErr as unknown as Record<string, unknown>).code,
      details: (insertErr as unknown as Record<string, unknown>).details,
      hint: (insertErr as unknown as Record<string, unknown>).hint,
    } : null,
    env: { keyPresent, keyPrefix, keyFormat },
    storeCount: pingData?.length ?? 0,
    orderCount: orderCheck?.length ?? 0,
  });
}
