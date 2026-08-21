import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MAX_ANSWER_CHARS, MemoirAiError, askGemini } from "@/lib/memoir/ai";

export const runtime = "nodejs";
export const maxDuration = 45;

/**
 * 원고 다듬기 — 말로 한 답변을 읽기 좋은 글로 정리한다.
 *
 * ⚠️ 절대 지킬 것: 사실을 더하지 않는다.
 *    구술을 받아쓴 글은 중복·군더더기가 많아 다듬기가 꼭 필요하지만,
 *    AI가 "그럴듯한 문장"을 채워 넣으면 그 순간 자서전이 아니라 소설이 된다(§14-A ②).
 *    그래서 프롬프트로 금지하고, 화면에서는 원본을 지우지 않고 나란히 보여준다.
 */
const Schema = z.object({
  text: z.string().min(20).max(MAX_ANSWER_CHARS),
});

function buildPrompt(text: string): string {
  return `아래는 어떤 분이 자서전을 위해 말로 답한 것을 그대로 받아쓴 글입니다.
이것을 책에 실을 수 있는 문장으로 다듬어 주세요.

[원문]
${text}

반드시 지킬 것:
1. 원문에 없는 사실·숫자·이름·감정을 절대 만들어 넣지 마세요. 이것이 가장 중요합니다.
2. 원문에 있는 사실·숫자·이름은 하나도 빠뜨리지 마세요.
3. 하는 일: 반복되는 말 정리, 문장 끊기, 조사·어미 다듬기, 순서 정돈, 문단 나누기.
4. 하지 않는 일: 미화, 요약, 교훈 덧붙이기, 극적인 표현 넣기.
5. 말투는 원문의 말투를 살립니다. 1인칭 회고체("나는 ~했다")로 씁니다.
6. 원문이 짧으면 짧은 대로 두세요. 늘리지 마세요.

다듬은 글만 출력하세요. 설명이나 머리말은 쓰지 마세요.`;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
    }

    const polished = await askGemini(buildPrompt(parsed.data.text), false);
    return NextResponse.json({ ok: true, polished });
  } catch (error) {
    if (error instanceof MemoirAiError) {
      console.error("[memoir/polish]", error.code, error.message);
      return NextResponse.json({ ok: false, error: error.code }, { status: 502 });
    }
    console.error("[memoir/polish] unexpected:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
