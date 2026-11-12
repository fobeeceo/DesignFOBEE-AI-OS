export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MOCK_STORES } from "@/lib/gbrick/mockData";

const GBRICK_URL = "https://rzgrkrffksqdeztzxyrt.supabase.co";

export async function GET() {
  const key =
    process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_GBRICK_SUPABASE_ANON_KEY ??
    null;

  if (!key) {
    return NextResponse.json({ ok: false, error: "GBRICK_SUPABASE_SERVICE_ROLE_KEY 미설정" });
  }

  const sb = createClient(GBRICK_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const results: { id: string; action: string; name: string; error?: string }[] = [];

  for (const s of MOCK_STORES) {
    const { data: existing } = await sb.from("gb_stores").select("id, name").eq("id", s.id).single();

    if (existing) {
      // 이름이 다르면 업데이트
      if (existing.name !== s.name) {
        const { error } = await sb.from("gb_stores").update({
          name: s.name,
          address: s.address,
          phone: s.phone,
          brandName: s.brandName,
          updatedAt: new Date().toISOString(),
        }).eq("id", s.id);
        results.push({ id: s.id, action: error ? "update_failed" : "updated", name: s.name, error: error?.message });
      } else {
        results.push({ id: s.id, action: "already_correct", name: s.name });
      }
    } else {
      // 없으면 삽입
      const { error } = await sb.from("gb_stores").insert({
        id: s.id,
        code: s.code,
        name: s.name,
        brandName: s.brandName,
        address: s.address,
        phone: s.phone,
        status: s.status,
        pointRate: s.pointRate,
        stampGoal: s.stampGoal,
        operatingHours: {},
      });
      results.push({ id: s.id, action: error ? "insert_failed" : "inserted", name: s.name, error: error?.message });
    }
  }

  return NextResponse.json({ ok: true, results });
}
