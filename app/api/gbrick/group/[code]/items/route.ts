export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { isRoomCode } from "@/lib/gbrick/groupOrder";
import { putMemberItems } from "@/lib/gbrick/groupService";

/** PUT /api/gbrick/group/:code/items — 내 메뉴 올리기·고치기·빼기. 처음이면 pid·secret 을 돌려주니 이 기기에 저장해 둔다. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!isRoomCode(code)) return NextResponse.json({ error: "함께오더를 찾을 수 없어요" }, { status: 404 });
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  try {
    const r = await putMemberItems(code, body);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json("removed" in r ? { removed: true } : { pid: r.pid, secret: r.secret, subtotal: r.subtotal });
  } catch (err) {
    console.error("[PUT /api/gbrick/group/:code/items]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "메뉴를 올리지 못했어요. 잠시 후 다시 시도해 주세요" }, { status: 500 });
  }
}
