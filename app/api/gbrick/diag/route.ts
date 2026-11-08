export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GBRICK_URL = "https://rzgrkrffksqdeztzxyrt.supabase.co";

export async function GET() {
  const deployedAt = "2026-11-08T_gbrick-key-fix"; // 배포 버전 확인용

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const gbrickSvcKey = process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY;
  const gbrickAnonKey = process.env.NEXT_PUBLIC_GBRICK_SUPABASE_ANON_KEY;
  const genericSvcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const genericAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const usedUrl = envUrl.includes("rzgrkrffksqdeztzxyrt") ? envUrl : GBRICK_URL;
  const usedKey =
    gbrickSvcKey ??
    gbrickAnonKey ??
    (envUrl.includes("rzgrkrffksqdeztzxyrt") ? (genericSvcKey ?? genericAnonKey) : null) ??
    "";

  const envInfo = {
    deployedAt,
    // GBRICK 전용 키
    hasGbrickSvcKey: !!gbrickSvcKey,
    hasGbrickAnonKey: !!gbrickAnonKey,
    gbrickAnonHint: gbrickAnonKey ? gbrickAnonKey.slice(0, 20) + "..." : "none",
    // 범용 키
    hasGenericSvcKey: !!genericSvcKey,
    hasGenericAnonKey: !!genericAnonKey,
    genericAnonHint: genericAnonKey ? genericAnonKey.slice(0, 20) + "..." : "none",
    // URL
    supabaseUrl: envUrl || "not set",
    usedUrl,
    keySource:
      gbrickSvcKey ? "GBRICK_SUPABASE_SERVICE_ROLE_KEY" :
      gbrickAnonKey ? "NEXT_PUBLIC_GBRICK_SUPABASE_ANON_KEY" :
      (envUrl.includes("rzgrkrffksqdeztzxyrt") && genericSvcKey) ? "SUPABASE_SERVICE_ROLE_KEY" :
      (envUrl.includes("rzgrkrffksqdeztzxyrt") && genericAnonKey) ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" :
      "none — GBRICK Supabase 연결 불가",
  };

  // Supabase 직접 읽기 테스트
  let readResult: unknown = null;
  let readError: string | null = null;
  if (usedKey) {
    try {
      const sb = createClient(usedUrl, usedKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data, error } = await sb
        .from("gb_menus")
        .select("id, name, basePrice, updatedAt")
        .order("updatedAt", { ascending: false })
        .limit(5);
      if (error) readError = error.message;
      else readResult = data;
    } catch (e) {
      readError = String(e);
    }
  } else {
    readError = "키 없음 — Vercel에 NEXT_PUBLIC_GBRICK_SUPABASE_ANON_KEY 환경변수 추가 필요";
  }

  return NextResponse.json({ envInfo, readResult, readError }, {
    headers: { "Cache-Control": "no-store" },
  });
}
