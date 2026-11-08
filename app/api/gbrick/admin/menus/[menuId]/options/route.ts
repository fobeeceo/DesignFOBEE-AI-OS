export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sbMenuRepo } from "@/lib/gbrick/repositories/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ menuId: string }> }) {
  try {
    const { menuId } = await params;
    const options = await sbMenuRepo.findOptions(menuId);
    return NextResponse.json({ options }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[GET /api/gbrick/admin/menus/options]", err);
    return NextResponse.json({ options: [] });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ menuId: string }> }) {
  try {
    const { menuId } = await params;
    const body = await req.json() as { groupName: string; name: string; extraPrice: number; isDefault?: boolean };
    const option = await sbMenuRepo.addOption(menuId, body);
    return NextResponse.json({ option });
  } catch (err) {
    console.error("[POST /api/gbrick/admin/menus/options]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { optionId } = await req.json() as { optionId: string };
    await sbMenuRepo.deleteOption(optionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/gbrick/admin/menus/options]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
