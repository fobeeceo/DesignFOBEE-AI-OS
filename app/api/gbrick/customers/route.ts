import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

// GET: 현재 로그인 고객 정보
export async function GET(_req: NextRequest) {
  if (IS_MOCK_MODE) {
    return NextResponse.json({
      customer: { id: "mock_user", email: "guest@gbrick.co.kr", nickname: "게스트", isActive: true, pointAccount: { balance: 500 } },
      mock: true,
    });
  }
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const customer = await prisma.gbCustomer.findUnique({
      where: { id: user.id },
      include: {
        pointAccount: { select: { balance: true, totalEarned: true, totalUsed: true } },
        stampAccounts: { select: { storeId: true, balance: true, totalEarned: true } },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "고객 정보 없음" }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (err) {
    console.error("[GET /api/gbrick/customers]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST: 회원가입 후 고객 프로필 생성
export async function POST(req: NextRequest) {
  if (IS_MOCK_MODE) {
    return NextResponse.json({ customer: { id: "mock_user" }, mock: true }, { status: 201 });
  }
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const body = await req.json();
    const { nickname, phone, birthdate, marketingAgree, pushAgree } = body;

    const existing = await prisma.gbCustomer.findUnique({ where: { id: user.id } });
    if (existing) {
      return NextResponse.json({ error: "이미 가입된 고객입니다" }, { status: 409 });
    }

    const customer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const c = await tx.gbCustomer.create({
        data: {
          id: user.id,
          email: user.email,
          nickname,
          phone,
          birthdate,
          marketingAgree: !!marketingAgree,
          pushAgree: !!pushAgree,
        },
      });
      await tx.gbPointAccount.create({ data: { customerId: user.id } });
      return c;
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/gbrick/customers]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
