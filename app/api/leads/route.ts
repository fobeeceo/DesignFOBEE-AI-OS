import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { leadSchema, franchiseLeadSchema } from "@/lib/validations/lead.schema";
import { createLead } from "@/services/leadService";
import { InteriorDesignError } from "@/agents/interiorDesignAgent";
import { FRANCHISE_SOURCE } from "@/lib/franchise/constants";
import { describeFit } from "@/lib/franchise/leadIntelligence";
import { getCasesByCodes } from "@/lib/franchise/successCases";
import { sendLeadNotification } from "@/lib/notifications/leadEmail";
import type { CreateLeadInput, CreateLeadResponse } from "@/types/lead";

export async function POST(req: NextRequest) {
  // catch 블록에서도 접근해야 하므로 try 밖에 둔다.
  // DB 저장이 실패해도 검증을 통과한 입력값이 있으면 메일로 남겨 리드 유실을 막는다.
  let parsed: CreateLeadInput | undefined;

  try {
    const body = await req.json();
    parsed =
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

    // 저장 성공 알림 — 실패해도 접수 자체는 이미 끝났으므로 응답에 영향을 주지 않는다.
    await sendLeadNotification(parsed, {
      saved: true,
      leadId: lead.id,
      referenceNo: lead.referenceNo,
    });

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

    // DB 저장 실패(예: Supabase 일시정지). 검증을 통과한 입력이 있으면 메일로라도 남긴다.
    // 메일 발송에 성공하면 리드가 보존된 것이므로 고객에게는 오류를 노출하지 않는다.
    if (parsed) {
      const mailed = await sendLeadNotification(parsed, {
        saved: false,
        failureReason: error instanceof Error ? error.message : String(error),
      });

      if (mailed) {
        return NextResponse.json<CreateLeadResponse>({ success: true }, { status: 201 });
      }
    }

    return NextResponse.json<CreateLeadResponse>(
      { success: false, error: "상담 신청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
