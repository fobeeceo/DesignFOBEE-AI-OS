import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  MAX_ANSWER_CHARS,
  MemoirAiError,
  askGemini,
  checkIpUsage,
  consumeIpUsage,
  ipFrom,
} from "@/lib/memoir/ai";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * 꼬리질문 — 답변을 읽고 "더 물어봐야 할 것" 세 가지를 돌려준다.
 *
 * ⚠️ 이 API는 질문만 만든다. 답변 내용을 요약하거나 사실을 덧붙이지 않는다.
 *    자서전에서 AI가 사실을 만들어내는 순간 그 책은 가치를 잃는다(§14-A ②·⑤).
 *
 * ⚠️ 답변 원문이 서버를 거친다. 화면에서 이 사실을 명시하고, 사용자가 버튼을 누를 때만 호출한다.
 */
const Schema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(10).max(MAX_ANSWER_CHARS),
  /** 사용자가 직접 넣은 개인 API 키. 없으면 서버 키 + 하루 무료 횟수를 쓴다. */
  byokKey: z.string().trim().max(200).nullish(),
});

function buildPrompt(question: string, answer: string): string {
  return `당신은 자서전 인터뷰어입니다. 아래는 한 사람이 자기 인생에 대해 남긴 답변입니다.

[받은 질문]
${question}

[그분의 답변]
${answer}

이 답변을 읽고, 이야기를 더 깊고 구체적으로 만들 꼬리질문 3개를 만드세요.

반드시 지킬 것:
1. 답변에 실제로 나온 내용에만 근거해 물으세요. 나오지 않은 사실을 전제로 묻지 마세요.
2. 한 질문에 한 가지만 물으세요.
3. 요약이 아니라 장면·숫자·감각(냄새·소리·표정·날짜·금액)을 묻는 질문으로 만드세요.
4. 답변자가 40~80대일 수 있습니다. 짧고 쉬운 존댓말로 쓰세요. 한 질문은 40자를 넘기지 마세요.
5. 평가하거나 위로하지 마세요. 묻기만 하세요.

JSON으로만 답하세요:
{"questions": ["질문1", "질문2", "질문3"]}`;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
    }

    // 개인 키를 쓰면 무료 횟수를 차감하지 않는다 — 본인 비용으로 부르는 것이기 때문이다.
    const byok = parsed.data.byokKey?.trim() || null;
    const ip = ipFrom(request.headers);
    if (!byok && !checkIpUsage(ip).allowed) {
      return NextResponse.json({ ok: false, error: "RATE_LIMITED", remaining: 0 }, { status: 429 });
    }

    const raw = await askGemini(buildPrompt(parsed.data.question, parsed.data.answer), true, byok);
    const data = JSON.parse(raw) as { questions?: unknown };
    const questions = Array.isArray(data.questions)
      ? data.questions.filter((q): q is string => typeof q === "string" && q.trim().length > 0).slice(0, 3)
      : [];

    if (questions.length === 0) {
      return NextResponse.json({ ok: false, error: "NO_RESULT" }, { status: 502 });
    }

    const remaining = byok ? null : consumeIpUsage(ip);
    return NextResponse.json({ ok: true, questions, remaining });
  } catch (error) {
    if (error instanceof MemoirAiError) {
      console.error("[memoir/followup]", error.code, error.message);
      return NextResponse.json({ ok: false, error: error.code }, { status: 502 });
    }
    console.error("[memoir/followup] unexpected:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
