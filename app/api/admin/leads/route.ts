import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/auth/requireAdmin";
import { listLeads } from "@/services/crmService";
import type { LeadStatus } from "@/types/lead";

const VALID_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"];

/**
 * GET /api/admin/leads?status=&q=&page=
 * STEP 9: 관리자 리드 목록 조회 (필터/검색/페이지네이션).
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam && VALID_STATUSES.includes(statusParam as LeadStatus)
        ? (statusParam as LeadStatus)
        : undefined;
    const q = searchParams.get("q") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1") || 1;

    const result = await listLeads({ status, q, page });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      const status = error.code === "NOT_LOGGED_IN" ? 401 : 403;
      return NextResponse.json({ success: false, error: error.message }, { status });
    }

    console.error("[GET /api/admin/leads]", error);
    return NextResponse.json(
      { success: false, error: "리드 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
