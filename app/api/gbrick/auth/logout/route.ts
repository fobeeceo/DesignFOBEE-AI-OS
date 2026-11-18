export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { MEMBER_COOKIE } from "@/lib/gbrick/member";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(MEMBER_COOKIE);
  return res;
}
