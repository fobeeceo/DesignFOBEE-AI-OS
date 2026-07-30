import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { leadSchema, franchiseLeadSchema } from "@/lib/validations/lead.schema";
import { createLead } from "@/services/leadService";
import { InteriorDesignError } from "@/agents/interiorDesignAgent";
import type { CreateLeadResponse } from "@/types/lead";

/** /franchise 상담 폼이 보내는 source — 이 경우에만 확장 스키마로 검증한다. */
const FRANCHISE_SOURCE = "franchise_page";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed =
      body?.source === FRANCHISE_SOURCE ? franchiseLeadSchema.parse(body) : leadSchema.parse(body);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const lead = await createLead({ ...parsed, profileId: user?.id });

    return NextResponse.json<CreateLeadResponse>(
      { success: true, leadId: lead.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json<CreateLeadResponse>(
        { success: false, error: error.errors[0]?.message ?? "입력값이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (error instanceof InteriorDesignError) {
      return NextResponse.json<CreateLeadResponse>(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.error("[POST /api/leads]", error);
    return NextResponse.json<CreateLeadResponse>(
      { success: false, error: "상담 신청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
