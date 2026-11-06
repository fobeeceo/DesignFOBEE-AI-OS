import { NextRequest, NextResponse } from "next/server";
import { IS_MOCK_MODE, MOCK_RECENT_ORDERS } from "@/lib/gbrick/mockData";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    if (IS_MOCK_MODE) {
      let orders = [...MOCK_RECENT_ORDERS];
      if (storeId) orders = orders.filter((o) => o.storeId === storeId);
      if (status) orders = orders.filter((o) => o.status === status);
      const total = orders.length;
      const sliced = orders.slice((page - 1) * limit, page * limit);
      return NextResponse.json({ orders: sliced, total, page, limit, mock: true });
    }

    const where: Record<string, unknown> = {};
    if (storeId) where.storeId = storeId;
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.gbOrder.findMany({
        where,
        include: { items: { include: { menu: true } }, payment: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.gbOrder.count({ where }),
    ]);
    return NextResponse.json({ orders, total, page, limit });
  } catch (err) {
    console.error("[GET /api/gbrick/hq/orders]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
