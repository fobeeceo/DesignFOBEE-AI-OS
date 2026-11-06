import { NextRequest, NextResponse } from "next/server";
import { IS_MOCK_MODE, MOCK_STORES, MOCK_STORE_STATS } from "@/lib/gbrick/mockData";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    if (IS_MOCK_MODE) {
      const stores = MOCK_STORES.map((s) => ({
        ...s,
        stats: MOCK_STORE_STATS.find((st) => st.storeId === s.id) ?? null,
      }));
      return NextResponse.json({ stores, mock: true });
    }

    const stores = await prisma.gbStore.findMany({ orderBy: { code: "asc" } });
    return NextResponse.json({ stores });
  } catch (err) {
    console.error("[GET /api/gbrick/hq/stores]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, address, phone, pointRate = 0.03, stampGoal = 10 } = body;

    if (!code || !name || !address) {
      return NextResponse.json({ error: "code, name, address 필수" }, { status: 400 });
    }

    if (IS_MOCK_MODE) {
      const mockStore = { id: `store_${Date.now()}`, code, name, address, phone, status: "PREPARING", pointRate, stampGoal, imageUrl: null, operatingHours: {}, brandName: "GBRICK Coffee", lat: null, lng: null };
      return NextResponse.json({ store: mockStore, mock: true }, { status: 201 });
    }

    const store = await prisma.gbStore.create({
      data: { code, name, address, phone, pointRate, stampGoal },
    });
    return NextResponse.json({ store }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/gbrick/hq/stores]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
