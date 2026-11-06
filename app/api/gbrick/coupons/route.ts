import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCustomerCoupons, issueWelcomeCoupon, validateCoupon } from "@/lib/gbrick/services/couponService";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function GET(_req: NextRequest) {
  if (IS_MOCK_MODE) {
    return NextResponse.json({ coupons: [], mock: true });
  }
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const coupons = await getCustomerCoupons(user.id);
    return NextResponse.json({ coupons });
  } catch (err) {
    console.error("[GET /api/gbrick/coupons]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, couponIssueId, orderAmount } = body;

  if (IS_MOCK_MODE) {
    if (action === "validate") {
      return NextResponse.json({ discount: 0, mock: true });
    }
    return NextResponse.json({ issue: null, mock: true }, { status: 201 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    if (action === "issue_welcome") {
      const issue = await issueWelcomeCoupon(user.id);
      return NextResponse.json({ issue }, { status: 201 });
    }

    if (action === "validate" && couponIssueId) {
      const result = await validateCoupon(couponIssueId, orderAmount ?? 0);
      return NextResponse.json({ discount: result.discount });
    }

    return NextResponse.json({ error: "유효하지 않은 action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "서버 오류";
    console.error("[POST /api/gbrick/coupons]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
