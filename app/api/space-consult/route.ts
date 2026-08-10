import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ZodError } from "zod";
import { spaceConsultSchema } from "@/lib/validations/lead.schema";
import { validateDrawings } from "@/lib/consult/validateDrawings";
import { uploadConsultDrawing, createConsultDrawingLinks } from "@/lib/supabase/storage";
import { createLead } from "@/services/leadService";
import { sendLeadNotification } from "@/lib/notifications/leadEmail";
import { CONSULT_SOURCE } from "@/lib/consult/content";
import type { CreateLeadInput } from "@/types/lead";

/**
 * 공간 상담 접수 — 도면 첨부 포함.
 *
 * 흐름: 입력 검증 → 파일 재검증 → 비공개 버킷 업로드 → DB 저장 → 알림 메일(서명 링크 포함)
 *
 * 설계 원칙
 * - 파일은 비공개 버킷에 올리고 DB에는 경로만 남긴다(공개 URL 생성 안 함).
 * - 업로드가 끝난 뒤에 DB에 쓴다. 순서를 바꾸면 경로만 있고 파일이 없는 행이 생긴다.
 * - DB 저장이 실패해도 메일은 보낸다. 메일이 유일한 기록이 되는 상황을 대비한다
 *   (2026-07-30 상담 유실 사고의 재발 방지 — /api/leads와 같은 원칙).
 */

/** 업로드까지 마친 뒤 실패하면 남은 파일을 지우지 않는다. 고아 파일이 남더라도
 *  고객 도면을 지우는 쪽이 더 위험하다. 월별 폴더라 나중에 정리할 수 있다. */
export const runtime = "nodejs";
export const maxDuration = 60;

function buildMessage(v: {
  spaceType: string;
  spaceState: string;
  area?: string;
  timing?: string;
  message?: string;
}): string {
  const lines = [
    `공간 유형: ${v.spaceType}`,
    `현재 상태: ${v.spaceState}`,
    v.area ? `면적: ${v.area}` : null,
    v.timing ? `공사 예정 시기: ${v.timing}` : null,
    v.message ? `\n원하시는 방향:\n${v.message}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  // catch에서도 써야 하므로 try 밖에 둔다 — DB가 죽어도 메일로 남기기 위함이다.
  let leadInput: CreateLeadInput | undefined;

  try {
    const form = await req.formData();

    const parsed = spaceConsultSchema.parse({
      name: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email") ?? "",
      spaceType: form.get("spaceType"),
      spaceState: form.get("spaceState"),
      area: form.get("area") ?? "",
      region: form.get("region"),
      timing: form.get("timing") ?? "",
      message: form.get("message") ?? "",
      privacyConsent: form.get("privacyConsent") === "on" || form.get("privacyConsent") === "true",
    });

    // 클라이언트 검증을 믿지 않는다. 개수·크기·확장자·MIME을 서버에서 다시 본다.
    const check = validateDrawings(form.getAll("drawings"));
    if (!check.ok) {
      return NextResponse.json({ success: false, error: check.reason }, { status: 400 });
    }

    // 접수 식별자를 먼저 만들어 파일 경로를 한 폴더로 묶는다.
    const referenceId = randomUUID();
    const paths: string[] = [];
    for (const [i, file] of check.files.entries()) {
      paths.push(await uploadConsultDrawing({ referenceId, file, index: i }));
    }

    leadInput = {
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email || undefined,
      message: buildMessage(parsed),
      source: CONSULT_SOURCE,
      preferredRegion: parsed.region,
      plannedTiming: parsed.timing || undefined,
      consultationPurpose: parsed.spaceType,
      privacyConsent: true,
      attachments: paths,
    };

    const lead = await createLead(leadInput);

    // 도면은 비공개라 메일에 원본 URL을 넣을 수 없다. 30일 서명 링크로 바꿔 넣는다.
    const links = await createConsultDrawingLinks(paths);
    await sendLeadNotification(leadInput, {
      saved: true,
      leadId: lead.id,
      referenceNo: lead.referenceNo,
      attachmentLinks: links,
    });

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message ?? "입력값을 확인해주세요." },
        { status: 400 }
      );
    }

    console.error("[POST /api/space-consult]", error);

    // DB가 죽었어도 검증을 통과한 입력이 있으면 메일로 남긴다. 상담을 잃지 않는 게 우선이다.
    if (leadInput) {
      const links = await createConsultDrawingLinks(leadInput.attachments ?? []).catch(() => []);
      const mailed = await sendLeadNotification(leadInput, {
        saved: false,
        failureReason: error instanceof Error ? error.message : String(error),
        attachmentLinks: links,
      });
      if (mailed) {
        return NextResponse.json({ success: true }, { status: 201 });
      }
    }

    return NextResponse.json(
      { success: false, error: "상담 신청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
