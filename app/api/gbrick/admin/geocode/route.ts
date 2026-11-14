export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GBRICK_URL = "https://rzgrkrffksqdeztzxyrt.supabase.co";

function getSb() {
  const key =
    process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_GBRICK_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(GBRICK_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// 알려진 매장 좌표 — name·address 키워드로 매칭
const KNOWN: Array<{ match: string[]; lat: number; lng: number }> = [
  { match: ["은평", "뉴타운", "esp-001"],        lat: 37.6225, lng: 126.9241 },
  { match: ["인덕원"],                           lat: 37.3907, lng: 126.9558 },
  { match: ["덕은"],                             lat: 37.6176, lng: 126.8601 },
  { match: ["김포"],                             lat: 37.6155, lng: 126.6975 },
  { match: ["일산"],                             lat: 37.6584, lng: 126.8323 },
  { match: ["강남", "삼성동"],                   lat: 37.5172, lng: 127.0473 },
  { match: ["홍대", "합정"],                     lat: 37.5565, lng: 126.9238 },
  { match: ["신촌"],                             lat: 37.5595, lng: 126.9368 },
  { match: ["수원"],                             lat: 37.2636, lng: 127.0286 },
  { match: ["분당", "성남"],                     lat: 37.3838, lng: 127.1178 },
];

function matchCoords(name: string, addr: string) {
  const text = `${name} ${addr}`.toLowerCase();
  for (const c of KNOWN) {
    if (c.match.some(k => text.includes(k.toLowerCase()))) return { lat: c.lat, lng: c.lng };
  }
  return null;
}

/** GET — 현재 매장 좌표 현황 조회 */
export async function GET() {
  try {
    const sb = getSb();
    const { data, error } = await sb
      .from("gb_stores")
      .select("id, name, address, lat, lng, status")
      .order("name");
    if (error) throw error;
    const stores = (data ?? []).map(s => ({
      ...s,
      hasCoords: !!(s.lat && s.lng),
    }));
    return NextResponse.json({ stores, missing: stores.filter(s => !s.hasCoords).length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** POST — 좌표 없는 매장에 알려진 좌표 자동 입력 */
export async function POST() {
  try {
    const sb = getSb();
    const { data: stores, error } = await sb
      .from("gb_stores")
      .select("id, name, address, lat, lng");
    if (error) throw error;

    const updated: string[] = [];
    const skipped: string[] = [];

    for (const store of stores ?? []) {
      if (store.lat && store.lng) { skipped.push(store.name); continue; }
      const coords = matchCoords(store.name ?? "", store.address ?? "");
      if (coords) {
        const { error: ue } = await sb
          .from("gb_stores")
          .update({ lat: coords.lat, lng: coords.lng })
          .eq("id", store.id);
        if (!ue) updated.push(`${store.name} → ${coords.lat}, ${coords.lng}`);
        else skipped.push(`${store.name} (오류: ${ue.message})`);
      } else {
        skipped.push(`${store.name} (매칭 없음)`);
      }
    }

    return NextResponse.json({ updated, skipped, totalUpdated: updated.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
