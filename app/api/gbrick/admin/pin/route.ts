export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { POS_COOKIE, createPosSession, posCookieOptions, posPin, verifyPosSession } from "@/lib/gbrick/posAuth";

// POST — PIN 확인. 맞으면 서버 인증 쿠키를 준다 (수정·삭제 요청에 필요)
export async function POST(req: NextRequest) {
  const { pin } = await req.json().catch(() => ({ pin: "" }));
  if (!pin || String(pin) !== posPin()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(POS_COOKIE, await createPosSession(), posCookieOptions);
  return res;
}

// GET — 이 브라우저가 서버 인증을 갖고 있는지. 갖고 있으면 기한을 새로 늘려 준다.
export async function GET(req: NextRequest) {
  const ok = await verifyPosSession(req.cookies.get(POS_COOKIE)?.value);
  const res = NextResponse.json({ ok }, { headers: { "Cache-Control": "no-store" } });
  if (ok) res.cookies.set(POS_COOKIE, await createPosSession(), posCookieOptions);
  return res;
}
