import { NextRequest, NextResponse } from "next/server";
import { storeRepo } from "@/lib/gbrick/repositories";
import { MOCK_STORES, IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;

    if (IS_MOCK_MODE) {
      const store = MOCK_STORES.find((s) => s.id === storeId);
      if (!store) return NextResponse.json({ error: "매장을 찾을 수 없습니다" }, { status: 404 });
      return NextResponse.json({ store, mock: true });
    }

    const store = await storeRepo.findById(storeId);
    if (!store) return NextResponse.json({ error: "매장을 찾을 수 없습니다" }, { status: 404 });
    return NextResponse.json({ store });
  } catch (err) {
    console.error("[GET /api/gbrick/stores/[storeId]]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
