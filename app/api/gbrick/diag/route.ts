export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GBRICK_URL = "https://rzgrkrffksqdeztzxyrt.supabase.co";

export async function GET() {
  const deployedAt = "2026-11-08T_6c7867d"; // 배포 버전 확인용

  // 환경변수 상태
  const envSvcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const usedUrl = envUrl.includes("rzgrkrffksqdeztzxyrt") ? envUrl : GBRICK_URL;
  const usedKey = envSvcKey ?? envAnonKey ?? "";

  const envInfo = {
    deployedAt,
    hasServiceKey: !!envSvcKey,
    hasAnonKey: !!envAnonKey,
    anonKeyHint: envAnonKey ? envAnonKey.slice(0, 20) + "..." : "none",
    supabaseUrl: envUrl || "not set",
    usedUrl,
  };

  // Supabase 직접 읽기 테스트
  let readResult: unknown = null;
  let readError: string | null = null;
  try {
    const sb = createClient(usedUrl, usedKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await sb
      .from("gb_menus")
      .select("id, name, basePrice, imageUrl, updatedAt")
      .order("updatedAt", { ascending: false })
      .limit(5);
    if (error) readError = error.message;
    else readResult = data;
  } catch (e) {
    readError = String(e);
  }

  return NextResponse.json({ envInfo, readResult, readError }, {
    headers: { "Cache-Control": "no-store" },
  });
}
