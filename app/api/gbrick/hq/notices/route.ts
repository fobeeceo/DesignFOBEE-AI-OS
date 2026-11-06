import { NextRequest, NextResponse } from "next/server";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";
import { prisma } from "@/lib/prisma";

const MOCK_NOTICES = [
  { id: "notice_1", storeId: null, title: "[공지] 11월 프로모션 안내", content: "11월 한 달간 스탬프 2배 적립 이벤트를 진행합니다.", isGlobal: true, createdAt: "2026-11-01T09:00:00Z" },
  { id: "notice_2", storeId: "store_gbrick_sinchon", title: "[신촌점] 메뉴 가격 안내", content: "12월부터 아메리카노 가격이 조정됩니다.", isGlobal: false, createdAt: "2026-10-28T14:00:00Z" },
];

export async function GET() {
  try {
    if (IS_MOCK_MODE) {
      return NextResponse.json({ notices: MOCK_NOTICES, mock: true });
    }

    const notices = await prisma.gbStoreNotice.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ notices });
  } catch (err) {
    console.error("[GET /api/gbrick/hq/notices]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, title, content, isGlobal = false } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title, content 필수" }, { status: 400 });
    }

    if (IS_MOCK_MODE) {
      const notice = { id: `notice_${Date.now()}`, storeId: storeId ?? null, title, content, isGlobal, createdAt: new Date().toISOString() };
      return NextResponse.json({ notice, mock: true }, { status: 201 });
    }

    const notice = await prisma.gbStoreNotice.create({
      data: { storeId: storeId ?? null, title, content, isGlobal: isGlobal, createdBy: "hq-admin" },
    });
    return NextResponse.json({ notice }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/gbrick/hq/notices]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
