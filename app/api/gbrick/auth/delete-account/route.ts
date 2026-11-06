export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function DELETE(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    if (IS_MOCK_MODE) {
      await supabase.auth.signOut();
      return NextResponse.json({ deleted: true, mock: true });
    }

    // 1. ACTIVE 주문이 있으면 탈퇴 거부
    const activeOrders = await prisma.gbOrder.count({
      where: {
        customerId: user.id,
        status: { notIn: ["CANCELLED", "PICKED_UP", "REFUNDED"] },
      },
    });
    if (activeOrders > 0) {
      return NextResponse.json({ error: "진행 중인 주문이 있어 탈퇴할 수 없습니다." }, { status: 400 });
    }

    // 2. 고객 소프트 삭제 (개인정보 익명화)
    await prisma.gbCustomer.update({
      where: { id: user.id },
      data: {
        isActive: false,
        nickname: "탈퇴한 고객",
        phone: null,
        birthdate: null,
        deletedAt: new Date(),
      },
    });

    // 3. Supabase Auth 계정 삭제 (service role 필요)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (serviceKey && supabaseUrl) {
      const adminClient = createAdminClient(supabaseUrl, serviceKey);
      await adminClient.auth.admin.deleteUser(user.id);
    }

    await supabase.auth.signOut();
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/gbrick/auth/delete-account]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
