import { NextRequest, NextResponse } from "next/server";
import { IS_MOCK_MODE, MOCK_STORES, MOCK_STORE_STATS } from "@/lib/gbrick/mockData";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    if (IS_MOCK_MODE) {
      const store = MOCK_STORES.find((s) => s.id === params.storeId);
      if (!store) return NextResponse.json({ error: "매장 없음" }, { status: 404 });
      return NextResponse.json({ store, stats: MOCK_STORE_STATS.find((s) => s.storeId === params.storeId), mock: true });
    }

    const store = await prisma.gbStore.findUnique({ where: { id: params.storeId } });
    if (!store) return NextResponse.json({ error: "매장 없음" }, { status: 404 });
    return NextResponse.json({ store });
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const body = await req.json();

    if (IS_MOCK_MODE) {
      return NextResponse.json({ store: { id: params.storeId, ...body }, mock: true });
    }

    const store = await prisma.gbStore.update({
      where: { id: params.storeId },
      data: body,
    });
    return NextResponse.json({ store });
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
