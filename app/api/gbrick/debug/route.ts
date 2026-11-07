export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const hasDb = !!process.env.DATABASE_URL;
  const hasAnon = !!(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-key"
  );
  const hasSvcRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isMock = (!hasDb && !hasAnon && !hasSvcRole) || process.env.USE_MOCK_DATA === "true";

  let menuDebug: { totalActive?: number; espresso?: number; espressoIds?: string[]; catIds?: string[]; error?: string } = {};
  try {
    const url = "https://rzgrkrffksqdeztzxyrt.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: cats } = await sb.from("gb_menu_categories").select("id,name").eq("isActive", true);
    const { data: menus } = await sb.from("gb_menus").select("id,categoryId,isActive").eq("isActive", true);
    const espMenus = (menus ?? []).filter((m: { categoryId: string }) => m.categoryId === "cat-esp-002");

    menuDebug = {
      totalActive: menus?.length ?? 0,
      espresso: espMenus.length,
      espressoIds: espMenus.map((m: { id: string }) => m.id).slice(0, 10),
      catIds: (cats ?? []).map((c: { id: string }) => c.id),
    };
  } catch (e) {
    menuDebug = { error: String(e) };
  }

  return NextResponse.json({
    DATABASE_URL: hasDb,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnon,
    SUPABASE_SERVICE_ROLE_KEY: hasSvcRole,
    IS_MOCK_MODE: isMock,
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) ?? "none",
    menuDebug,
  });
}
