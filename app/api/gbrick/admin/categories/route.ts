export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { updateCategories, createCategory, deleteCategory } from "@/lib/gbrick/repositories/supabase";
import { cleanName, cleanSortOrder } from "@/lib/gbrick/menuInput";

// PATCH /api/gbrick/admin/categories — 카테고리 이름·순서·노출을 한 번에 저장
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { categories?: unknown };
    if (!Array.isArray(body.categories) || body.categories.length === 0 || body.categories.length > 50) {
      return NextResponse.json({ error: "저장할 카테고리가 없습니다" }, { status: 400 });
    }
    const rows = [];
    for (const raw of body.categories as Record<string, unknown>[]) {
      const name = cleanName(raw?.name);
      const sortOrder = cleanSortOrder(raw?.sortOrder);
      if (typeof raw?.id !== "string" || !raw.id || name === null || sortOrder === null || typeof raw.isActive !== "boolean") {
        return NextResponse.json({ error: "카테고리 이름을 확인해 주세요" }, { status: 400 });
      }
      rows.push({ id: raw.id, name, sortOrder, isActive: raw.isActive });
    }
    await updateCategories(rows);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/gbrick/admin/categories]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST — 카테고리 추가 (맨 뒤에 붙는다)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { name?: unknown };
    const name = cleanName(body.name);
    if (name === null) return NextResponse.json({ error: "카테고리 이름을 확인해 주세요" }, { status: 400 });
    return NextResponse.json({ category: await createCategory(name) });
  } catch (err) {
    console.error("[POST /api/gbrick/admin/categories]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// DELETE — 메뉴가 없는 카테고리만 삭제
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { id?: unknown };
    if (typeof body.id !== "string" || !body.id) return NextResponse.json({ error: "카테고리를 찾을 수 없습니다" }, { status: 400 });
    if (!(await deleteCategory(body.id))) {
      return NextResponse.json({ error: "메뉴가 남아 있는 카테고리는 삭제할 수 없습니다. 메뉴를 먼저 삭제해 주세요." }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/gbrick/admin/categories]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
