import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * 가맹 자가진단 결과 수집.
 *
 * ⚠️ 개인정보(이름·연락처)는 받지 않는다. 점수·등급·시각만 남긴다.
 *    상담 신청 폼(/api/leads)에서만 동의와 함께 개인정보를 수집한다.
 *
 * 현재는 서버 로그로만 남긴다. Lead 테이블과 달리 별도 저장소가 없고,
 * 마이그레이션 미적용 상태에서 새 테이블을 만들 수 없기 때문이다.
 * 저장이 실패해도 진단 결과 화면은 정상 동작한다(클라이언트가 응답을 기다리지 않음).
 */
const diagnosisSchema = z.object({
  total: z.number().int().min(0).max(500),
  grade: z.enum(["S", "A", "B", "C", "D"]),
  by: z.object({
    A: z.number().int().min(0).max(100),
    B: z.number().int().min(0).max(100),
    C: z.number().int().min(0).max(100),
    D: z.number().int().min(0).max(100),
    E: z.number().int().min(0).max(100),
  }),
  at: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = diagnosisSchema.parse(await req.json());

    console.info("[franchise-diagnosis]", JSON.stringify(parsed));

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/franchise-diagnosis]", error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
