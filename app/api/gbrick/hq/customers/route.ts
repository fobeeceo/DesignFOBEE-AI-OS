import { NextRequest, NextResponse } from "next/server";
import { IS_MOCK_MODE, MOCK_CUSTOMERS } from "@/lib/gbrick/mockData";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    if (IS_MOCK_MODE) {
      let customers = [...MOCK_CUSTOMERS];
      if (q) {
        const lq = q.toLowerCase();
        customers = customers.filter(
          (c) => c.nickname.toLowerCase().includes(lq) || c.email.toLowerCase().includes(lq) || c.phone.includes(q)
        );
      }
      const total = customers.length;
      const sliced = customers.slice((page - 1) * limit, page * limit);
      return NextResponse.json({ customers: sliced, total, page, limit, mock: true });
    }

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { nickname: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.gbCustomer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.gbCustomer.count({ where }),
    ]);
    return NextResponse.json({ customers: users, total, page, limit });
  } catch (err) {
    console.error("[GET /api/gbrick/hq/customers]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
