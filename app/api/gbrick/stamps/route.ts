import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (IS_MOCK_MODE) {
      return NextResponse.json({ total: 3, current_progress: 3, completed_cards: 0, mock: true });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    // 고객 ID 조회
    const { data: customer } = await supabase
      .from("gb_customers")
      .select("id")
      .eq("userId", user.id)
      .single();

    if (!customer) return NextResponse.json({ total: 0, current_progress: 0, completed_cards: 0 });

    // gb_stamp_totals 뷰에서 조회
    const { data, error } = await supabase
      .from("gb_stamp_totals")
      .select("*")
      .eq("customerId", customer.id)
      .single();

    if (error || !data) return NextResponse.json({ total: 0, current_progress: 0, completed_cards: 0 });

    return NextResponse.json({
      total: Number(data.total ?? 0),
      current_progress: Number(data.current_progress ?? 0),
      completed_cards: Number(data.completed_cards ?? 0),
    });
  } catch (err) {
    console.error("[GET /api/gbrick/stamps]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
