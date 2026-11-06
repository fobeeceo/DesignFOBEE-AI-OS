import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { calcPointEarn } from "@/lib/gbrick/pointPolicy";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

function genOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GB${date}${rand}`;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    if (IS_MOCK_MODE) {
      return NextResponse.json({ orders: [], mock: true });
    }

    const orders = await prisma.gbOrder.findMany({
      where: { customerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        items: { include: { menu: { select: { name: true, imageUrl: true } } } },
        store: { select: { name: true } },
        payment: { select: { status: true, method: true } },
      },
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[GET /api/gbrick/orders]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { storeId, items, pickupName, note, pointUsed = 0, couponIssueId } = body;

    if (!storeId || !items?.length) {
      return NextResponse.json({ error: "storeId와 items는 필수입니다" }, { status: 400 });
    }

    if (IS_MOCK_MODE) {
      const mockOrder = {
        id: `order_mock_${Date.now()}`,
        orderNumber: genOrderNumber(),
        storeId,
        customerId: user?.id ?? null,
        status: "PENDING",
        totalAmount: items.reduce((s: number, i: { unitPrice: number; quantity: number }) => s + i.unitPrice * i.quantity, 0),
        finalAmount: items.reduce((s: number, i: { unitPrice: number; quantity: number }) => s + i.unitPrice * i.quantity, 0),
        items,
        pickupName,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ order: mockOrder, mock: true }, { status: 201 });
    }

    const store = await prisma.gbStore.findUnique({ where: { id: storeId } });
    if (!store) return NextResponse.json({ error: "매장을 찾을 수 없습니다" }, { status: 404 });

    const totalAmount = items.reduce((s: number, i: { unitPrice: number; quantity: number }) => s + i.unitPrice * i.quantity, 0);
    const finalAmount = Math.max(0, totalAmount - pointUsed);
    const pointEarned = calcPointEarn(finalAmount, store.pointRate);

    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const o = await tx.gbOrder.create({
        data: {
          orderNumber: genOrderNumber(),
          storeId,
          customerId: user?.id ?? null,
          isGuest: !user,
          status: "PENDING",
          totalAmount,
          finalAmount,
          pointUsed,
          pointEarned,
          pickupName,
          note,
          items: {
            create: items.map((item: { menuId: string; menuName: string; quantity: number; unitPrice: number; options?: { menuOptionId: string; optionName: string; extraPrice: number }[] }) => ({
              menuId: item.menuId,
              menuName: item.menuName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              options: item.options?.length
                ? { create: item.options }
                : undefined,
            })),
          },
        },
        include: { items: true },
      });

      await tx.gbOrderStatusHistory.create({
        data: { orderId: o.id, status: "PENDING", changedBy: user?.id ?? "guest" },
      });

      return o;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/gbrick/orders]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
