import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { profileInputSchema } from "@/lib/validations/profile.schema";
import { upsertProfile } from "@/services/profileService";

/**
 * POST /api/profile
 * 로그인된 사용자(쿠키 세션)의 프로필을 생성/갱신한다.
 * 회원가입 직후, 혹은 소셜 로그인 콜백 이후 클라이언트가 호출한다.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = profileInputSchema.parse(body);

    const profile = await upsertProfile({
      id: user.id,
      name: parsed.name,
      phone: parsed.phone,
      provider: parsed.provider,
    });

    return NextResponse.json({ success: true, profile }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message ?? "입력값이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    console.error("[POST /api/profile]", error);
    return NextResponse.json(
      { success: false, error: "프로필 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
