import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_STORES, IS_MOCK_MODE } from "@/lib/gbrick/mockData";
import { GbStoreStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as GbStoreStatus | null;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (IS_MOCK_MODE) {
      return NextResponse.json({ stores: MOCK_STORES, mock: true });
    }

    const stores = await prisma.gbStore.findMany({
      where: {
        status: status ?? GbStoreStatus.ACTIVE,
      },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        address: true,
        phone: true,
        pointRate: true,
        stampGoal: true,
        imageUrl: true,
        lat: true,
        lng: true,
        operatingHours: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ stores });
  } catch (err) {
    console.error("[GET /api/gbrick/stores]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (IS_MOCK_MODE) {
      return NextResponse.json({ error: "DB 연결 필요" }, { status: 503 });
    }

    const body = await req.json();
    const { code, name, address, ownerName, phone, pointRate, stampGoal } = body;

    if (!code || !name || !address) {
      return NextResponse.json({ error: "code, name, address는 필수입니다" }, { status: 400 });
    }

    const store = await prisma.gbStore.create({
      data: {
        code,
        name,
        address,
        ownerName,
        phone,
        pointRate: pointRate ?? 0.03,
        stampGoal: stampGoal ?? 10,
      },
    });

    return NextResponse.json({ store }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/gbrick/stores]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
