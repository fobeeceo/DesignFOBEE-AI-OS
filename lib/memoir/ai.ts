import { GoogleGenAI } from "@google/genai";
import { MEMOIR_DAILY_IP_LIMIT } from "@/lib/constants";

/**
 * 자서전 코너의 AI 호출 공통부.
 * 텍스트 모델은 저장소의 다른 에이전트(agents/*.ts)와 같은 것을 쓴다 — 한 곳만 바꾸면 되도록.
 */
const MODEL = "gemini-flash-latest";

/** 답변 원문이 지나치게 길면 잘라 보낸다. 자서전 답변 하나는 보통 2,000자를 넘지 않는다. */
export const MAX_ANSWER_CHARS = 6000;

export class MemoirAiError extends Error {
  constructor(message: string, public code: "NO_API_KEY" | "AI_FAILED" | "NO_RESULT") {
    super(message);
    this.name = "MemoirAiError";
  }
}

/**
 * IP당 하루 무료 횟수. /api/generate와 같은 방식(인메모리 Map)이다.
 *
 * ⚠️ 한계를 그대로 적어둔다: Vercel은 요청을 여러 인스턴스에 나눠 보내고 인스턴스가
 *    잠들면 이 Map도 사라진다. 즉 정확한 과금 차단 장치가 아니라 폭주를 늦추는
 *    완충 장치다. 비용을 확실히 묶으려면 Google AI Studio 쪽에서 예산 한도를 건다.
 *    꼬리질문과 글 다듬기가 하나의 횟수를 나눠 쓴다 — 쓰는 사람은 한 명이기 때문이다.
 */
const ipLimits = new Map<string, { count: number; resetAt: number }>();

export function ipFrom(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export function checkIpUsage(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const limit = ipLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    ipLimits.set(ip, { count: 0, resetAt: now + 24 * 60 * 60 * 1000 });
    return { allowed: true, remaining: MEMOIR_DAILY_IP_LIMIT };
  }

  return {
    allowed: limit.count < MEMOIR_DAILY_IP_LIMIT,
    remaining: Math.max(0, MEMOIR_DAILY_IP_LIMIT - limit.count),
  };
}

/** 성공했을 때만 차감한다 — 실패한 호출이 횟수를 먹으면 억울하다. */
export function consumeIpUsage(ip: string): number {
  const limit = ipLimits.get(ip);
  if (!limit) return MEMOIR_DAILY_IP_LIMIT;
  limit.count += 1;
  return Math.max(0, MEMOIR_DAILY_IP_LIMIT - limit.count);
}

/**
 * byokKey가 있으면 그것을 먼저 쓴다(/api/generate와 같은 규칙).
 * ⚠️ 이 값은 절대 로그에 남기지 않는다.
 */
export async function askGemini(
  instruction: string,
  asJson: boolean,
  byokKey?: string | null
): Promise<string> {
  const apiKey = (typeof byokKey === "string" && byokKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new MemoirAiError("서버의 GEMINI_API_KEY가 설정되지 않았습니다.", "NO_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });
  let res;
  try {
    res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: instruction }] }],
      config: asJson ? { responseMimeType: "application/json" } : undefined,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    throw new MemoirAiError(`AI 호출 실패: ${msg || "알 수 없는 오류"}`, "AI_FAILED");
  }

  const text = res.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim();
  if (!text) throw new MemoirAiError("결과가 비어 있습니다.", "NO_RESULT");
  return text;
}
