import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { leadSchema, franchiseLeadSchema } from "@/lib/validations/lead.schema";
import { createLead } from "@/services/leadService";
import { InteriorDesignError } from "@/agents/interiorDesignAgent";
import { FRANCHISE_SOURCE } from "@/lib/franchise/constants";
import { describeFit } from "@/lib/franchise/leadIntelligence";
import { getCasesByCodes } from "@/lib/franchise/successCases";
import type { CreateLeadResponse } from "@/types/lead";

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

    // 가맹상담이면 접수번호·AI 적합도·추천 성공사례를 완료 화면에 함께 돌려준다.
    const diagnosis =
      lead.fitScore != null
        ? {
            referenceNo: lead.referenceNo,
            fitScore: lead.fitScore,
            ...describeFit(lead.fitScore),
            recommendedCases: getCasesByCodes(lead.recommendedCases ?? []).map((item) => ({
              code: item.code,
              title: item.title,
              location: item.location,
              summary: item.summary,
              image: item.image,
            })),
          }
        : undefined;

    return NextResponse.json<CreateLeadResponse>(
      { success: true, leadId: lead.id, diagnosis },
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
