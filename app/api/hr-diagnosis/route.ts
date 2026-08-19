import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * ⚠️ 개인정보를 받지 않는다. 점수·등급·시각만 남긴다.
 * total은 영역별 100점 환산 합계(0~500), by도 영역별 환산점수(0~100)다.
 * 원점수(영역별 최대 50~250)를 그대로 보내지 않는다 — 결과 화면과 기준이 어긋나기 때문이다.
 */
const DiagnosisSchema = z.object({
  total: z.number().int().min(0).max(500),
  grade: z.enum(["S", "A", "B", "C", "D"]),
  by: z.record(z.string(), z.number().int().min(0).max(100)),
  at: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = DiagnosisSchema.safeParse(body);

    if (!result.success) {
      console.error("[hr-diagnosis] validation error:", result.error.flatten());
      return NextResponse.json(
        { ok: false, error: "invalid_request" },
        { status: 400 }
      );
    }

    console.info("[hr-diagnosis] received result:", {
      total: result.data.total,
      grade: result.data.grade,
      by: result.data.by,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[hr-diagnosis] unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
