export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GBRICK_URL = "https://rzgrkrffksqdeztzxyrt.supabase.co";

export async function GET() {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasDatabase = !!process.env.DATABASE_URL;
  const isMock = (!hasDatabase && !hasServiceKey) || process.env.USE_MOCK_DATA === "true";

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  let cats: unknown[] = [];
  let menus: unknown[] = [];
  let sbError = "";

  if (key) {
    try {
      const sb = createClient(GBRICK_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: c, error: e1 } = await sb.from("gb_menu_categories").select("id, name");
      if (e1) sbError = e1.message;
      cats = c ?? [];

      const { data: m, error: e2 } = await sb.from("gb_menus").select("id, name, categoryId").limit(5);
      if (e2 && !sbError) sbError = e2.message;
      menus = m ?? [];
    } catch (e) {
      sbError = String(e);
    }
  }

  return NextResponse.json({
    mode: isMock ? "MOCK" : hasServiceKey ? "SUPABASE" : hasDatabase ? "PRISMA" : "SUPABASE(anon)",
    hasServiceKey,
    hasAnonKey,
    hasDatabase,
    isMock,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40) ?? "(unset)",
    sbError: sbError || null,
    categoriesCount: cats.length,
    categories: cats,
    menusCount: menus.length,
    menus,
  });
}
