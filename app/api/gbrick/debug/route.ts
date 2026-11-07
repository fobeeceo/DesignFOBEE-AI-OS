import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GBRICK_URL = "https://rzgrkrffksqdeztzxyrt.supabase.co";

export async function GET() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(unset)";
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasDbUrl = !!process.env.DATABASE_URL;
  const useMock = process.env.USE_MOCK_DATA === "true";

  const url = envUrl.includes("rzgrkrffksqdeztzxyrt") ? envUrl : GBRICK_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let storeCount: number | null = null;
  let sbError: string | null = null;

  let queryResult: unknown = null;

  if (key) {
    try {
      const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data, error } = await sb.from("gb_stores").select("id, name, status").limit(5);
      if (error) {
        const e = error as unknown as Record<string,unknown>;
        sbError = JSON.stringify({ message: error.message, code: e.code, details: e.details, hint: e.hint });
      } else {
        storeCount = data?.length ?? 0;
        queryResult = data;
      }
    } catch (e) {
      sbError = String(e);
    }

    // raw HTTP test
    try {
      const res = await fetch(`${url}/rest/v1/gb_stores?select=id,name&limit=1`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
      const text = await res.text();
      queryResult = { httpStatus: res.status, body: text.slice(0, 300) };
    } catch (e2) {
      sbError = (sbError ?? "") + " | rawFetch: " + String(e2);
    }
  }

  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: envUrl,
      resolvedUrl: url,
      hasServiceKey,
      hasAnonKey,
      hasDbUrl,
      useMock,
    },
    supabase: { storeCount, error: sbError, rows: queryResult },
  });
}
