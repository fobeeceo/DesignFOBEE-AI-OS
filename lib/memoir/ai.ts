import { GoogleGenAI } from "@google/genai";

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

export async function askGemini(instruction: string, asJson: boolean): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
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
