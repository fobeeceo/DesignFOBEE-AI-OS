import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BOOK_KINDS, BOOK_STEPS, FIELD_LIMIT, buildPrompt } from "@/lib/bookwriter/prompts";
import { MemoirAiError, askGemini, checkIpUsage, consumeIpUsage, ipFrom } from "@/lib/memoir/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * 책 집필 도구 — 단계 이름과 작업 내용을 받아 프롬프트를 만들고 AI를 한 번 부른다.
 *
 * 프롬프트는 화면의 「Claude용 프롬프트 복사」와 같은 함수(lib/bookwriter/prompts.ts)로 만든다.
 * AI 호출·하루 무료 횟수·내 API 키는 자서전 코너와 같은 장치를 쓴다(lib/memoir/ai.ts) —
 * 한 사람이 두 도구를 오가도 무료 횟수는 하나로 센다.
 */
const short = z.string().max(FIELD_LIMIT.short).default("");
const medium = z.string().max(FIELD_LIMIT.medium).optional();
const long = z.string().max(FIELD_LIMIT.long).optional();

const Schema = z.object({
  step: z.enum(BOOK_STEPS),
  kind: z.enum(BOOK_KINDS),
  genre: short,
  premise: z.string().max(FIELD_LIMIT.medium).default(""),
  pov: short,
  tense: short,
  reader: medium,
  problem: medium,
  comps: long,
  positioning: long,
  authorInfo: medium,
  title: z.string().max(FIELD_LIMIT.short).optional(),
  subtitle: z.string().max(FIELD_LIMIT.short).optional(),
  targetPages: z.number().int().min(30).max(1000).optional(),
  chapterTarget: z.number().int().min(0).max(200000).optional(),
  draft: z.string().max(FIELD_LIMIT.chapter).optional(),
  idea: medium,
  bible: long,
  sources: long,
  chapterCount: z.number().int().min(3).max(60).optional(),
  outline: long,
  chapterTitle: z.string().max(FIELD_LIMIT.short).optional(),
  chapterSummary: medium,
  beats: long,
  styleSample: long,
  previous: medium,
  beat: medium,
  byokKey: z.string().trim().max(200).nullish(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
    }
    const { byokKey, ...input } = parsed.data;

    const byok = byokKey?.trim() || null;
    const ip = ipFrom(request.headers);
    if (!byok && !checkIpUsage(ip).allowed) {
      return NextResponse.json({ ok: false, error: "RATE_LIMITED", remaining: 0 }, { status: 429 });
    }

    const text = await askGemini(buildPrompt(input), input.step === "outline", byok);
    const remaining = byok ? null : consumeIpUsage(ip);
    return NextResponse.json({ ok: true, text, remaining });
  } catch (error) {
    if (error instanceof MemoirAiError) {
      console.error("[bookwriter]", error.code, error.message);
      return NextResponse.json({ ok: false, error: error.code }, { status: 502 });
    }
    console.error("[bookwriter] unexpected:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
