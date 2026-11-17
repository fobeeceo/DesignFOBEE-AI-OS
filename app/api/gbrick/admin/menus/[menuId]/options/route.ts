export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sbMenuRepo, updateMenuOptions, importDefaultOptions, copyMenuOptions } from "@/lib/gbrick/repositories/supabase";
import { cleanName, cleanPrice, cleanSortOrder } from "@/lib/gbrick/menuInput";
import { OPTION_GROUPS } from "@/lib/gbrick/optionGroups";

type Params = { params: Promise<{ menuId: string }> };
const GROUPS: readonly string[] = OPTION_GROUPS;

// 숨긴 옵션까지 포함한 이 메뉴의 옵션 목록
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { menuId } = await params;
    const options = await sbMenuRepo.findOptions(menuId);
    return NextResponse.json({ options }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[GET /api/gbrick/admin/menus/options]", err);
    return NextResponse.json({ options: [] });
  }
}

// 옵션 1개 추가, { importDefaults: true } 로 기본 옵션 불러오기, { copyTo: [메뉴ID…] } 로 이 메뉴의 옵션을 다른 메뉴에 그대로 복사
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { menuId } = await params;
    const body = await req.json() as Record<string, unknown>;

    if (body.importDefaults === true) {
      await importDefaultOptions(menuId);
      return NextResponse.json({ options: await sbMenuRepo.findOptions(menuId) });
    }

    if ("copyTo" in body) {
      const ids = body.copyTo;
      if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200 || ids.some(id => typeof id !== "string" || !id)) {
        return NextResponse.json({ error: "적용할 메뉴를 선택해 주세요" }, { status: 400 });
      }
      return NextResponse.json({ copied: await copyMenuOptions(menuId, ids as string[]) });
    }

    const name = cleanName(body.name);
    const extraPrice = cleanPrice(body.extraPrice);
    if (name === null || extraPrice === null || typeof body.groupName !== "string" || !GROUPS.includes(body.groupName)) {
      return NextResponse.json({ error: "옵션명·금액을 확인해 주세요" }, { status: 400 });
    }
    const option = await sbMenuRepo.addOption(menuId, { groupName: body.groupName, name, extraPrice });
    return NextResponse.json({ option });
  } catch (err) {
    console.error("[POST /api/gbrick/admin/menus/options]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 이름·금액·순서·노출을 한 번에 저장
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { menuId } = await params;
    const body = await req.json() as { options?: unknown };
    if (!Array.isArray(body.options) || body.options.length === 0 || body.options.length > 100) {
      return NextResponse.json({ error: "저장할 옵션이 없습니다" }, { status: 400 });
    }
    const rows = [];
    for (const raw of body.options as Record<string, unknown>[]) {
      const name = cleanName(raw?.name);
      const extraPrice = cleanPrice(raw?.extraPrice);
      const sortOrder = cleanSortOrder(raw?.sortOrder);
      if (typeof raw?.id !== "string" || !raw.id || name === null || extraPrice === null || sortOrder === null || typeof raw.isActive !== "boolean"
        || (raw.groupName !== undefined && (typeof raw.groupName !== "string" || !GROUPS.includes(raw.groupName)))) {
        return NextResponse.json({ error: "옵션명·금액을 확인해 주세요" }, { status: 400 });
      }
      rows.push({ id: raw.id, name, extraPrice, sortOrder, isActive: raw.isActive, ...(raw.groupName ? { groupName: raw.groupName as string } : {}) });
    }
    await updateMenuOptions(menuId, rows);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/gbrick/admin/menus/options]", err);
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
