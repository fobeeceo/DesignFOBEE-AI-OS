export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  const hasDb = !!process.env.DATABASE_URL;
  const hasAnon = !!(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-key"
  );
  const hasSvcRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isMock = (!hasDb && !hasAnon && !hasSvcRole) || process.env.USE_MOCK_DATA === "true";

  return NextResponse.json({
    DATABASE_URL: hasDb,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnon,
    SUPABASE_SERVICE_ROLE_KEY: hasSvcRole,
    NEXT_PUBLIC_SUPABASE_URL: hasUrl,
    IS_MOCK_MODE: isMock,
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) ?? "none",
  });
}
