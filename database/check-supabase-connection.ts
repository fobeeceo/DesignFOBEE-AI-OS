/**
 * GBRICK Supabase 연결 확인 스크립트 (DATABASE_URL 없이 사용)
 * 실행: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx database/check-supabase-connection.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ 필수 환경변수 누락:");
  if (!url) console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  if (!key) console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!url.includes("rzgrkrffksqdeztzxyrt")) {
  console.error("❌ 프로젝트 ID가 gbrick-app-dev가 아닙니다! 중단합니다.");
  console.error("   현재 URL:", url);
  process.exit(1);
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log("🔍 GBRICK Supabase 연결 확인...");
  console.log("   프로젝트:", url!.replace("https://", "").split(".")[0]);
  console.log("");

  // 1. 연결 테스트
  console.log("1️⃣  Supabase 연결 테스트...");
  const { error: pingErr } = await sb.from("gb_stores").select("id").limit(1);
  if (pingErr && pingErr.code !== "PGRST116" && !pingErr.message.includes("does not exist")) {
    if (pingErr.message.includes("does not exist") || pingErr.code === "42P01") {
      console.log("   ⚠️  gb_stores 테이블 없음 → Migration 필요");
    } else {
      console.error("   ❌ 연결 실패:", pingErr.message);
      process.exit(1);
    }
  } else if (!pingErr) {
    console.log("   ✅ Supabase 연결 성공\n");
  }

  // 2. GBRICK 테이블 확인 (pg_tables 직접 조회)
  console.log("2️⃣  GBRICK 테이블 확인...");
  const { data: tables, error: tableErr } = await sb.rpc("get_gb_tables").catch(() => ({ data: null, error: { message: "rpc not available" } }));

  if (!tables) {
    // rpc 없으면 각 테이블 직접 확인
    const knownTables = [
      "gb_stores", "gb_menus", "gb_menu_categories", "gb_menu_options",
      "gb_orders", "gb_order_items", "gb_order_item_options", "gb_order_status_history",
      "gb_payments", "gb_customers", "gb_point_accounts", "gb_point_ledger",
      "gb_stamp_accounts", "gb_stamp_ledger", "gb_coupons", "gb_coupon_issues",
      "gb_checklists", "gb_checklist_items", "gb_store_notices",
    ];
    const results = await Promise.all(
      knownTables.map(async (t) => {
        const { error } = await sb.from(t).select("id").limit(1);
        return { table: t, exists: !error || !error.message.includes("does not exist") };
      })
    );
    const existing = results.filter((r) => r.exists);
    const missing = results.filter((r) => !r.exists);
    console.log(`   존재: ${existing.length}/${knownTables.length}개`);
    if (missing.length > 0) {
      console.log(`   누락: ${missing.map((r) => r.table).join(", ")}`);
    } else {
      console.log("   ✅ 모든 주요 테이블 확인됨");
    }
  } else {
    console.log(`   ✅ ${tables.length}개 GB 테이블 확인됨`);
  }

  console.log("\n✅ 확인 완료.");
  console.log("\n다음 단계:");
  console.log("  테이블이 없는 경우:");
  console.log("  → Supabase 대시보드 → SQL Editor에서 아래 파일을 순서대로 실행:");
  console.log("    1. database/prisma/migrations/20261106000000_add_gbrick_tables/migration.sql");
  console.log("    2. database/rls-policies.sql");
  console.log("  테이블이 있는 경우:");
  console.log("  → NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
  console.log("    을 Vercel 환경변수에 등록하면 앱이 즉시 실제 DB 모드로 작동합니다.");
}

main().catch((err) => {
  console.error("❌ 스크립트 오류:", err);
  process.exit(1);
});
