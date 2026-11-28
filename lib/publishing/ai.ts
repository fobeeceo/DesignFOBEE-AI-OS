import { GoogleGenAI } from "@google/genai";

/**
 * AI 출판부 공통 호출부.
 * 모델은 저장소의 다른 에이전트(agents/*.ts)와 같은 것을 쓴다 — 한 곳만 바꾸면 되도록.
 */
const MODEL = "gemini-flash-latest";

export class PublishingAgentError extends Error {
  constructor(
    message: string,
    public code: "NO_API_KEY" | "AI_FAILED" | "NO_RESULT" | "BAD_JSON"
  ) {
    super(message);
    this.name = "PublishingAgentError";
  }
}

/**
 * 모든 출판부 AI가 공유하는 금지 규칙.
 *
 * 자서전에서 AI가 사실을 만들어내는 순간 그 책은 가치를 잃는다. 프롬프트마다
 * 따로 쓰면 하나가 빠져도 아무도 모르므로 한 곳에 두고 전부 가져다 쓴다(§14-A ⑥).
 */
export const NEVER_INVENT = `절대 지킬 것 — 어기면 이 작업 전체가 무효입니다:
- 원고에 없는 사실·숫자·이름·날짜·감정을 만들어내지 마세요.
- 원고에 있는 사실·숫자·이름을 바꾸거나 빠뜨리지 마세요.
- 저자의 경험을 해석하거나 평가하지 마세요.
- 모르는 것은 모른다고 하세요. 그럴듯하게 채우지 마세요.`;

export async function askJson(instruction: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new PublishingAgentError(
      "서버의 GEMINI_API_KEY가 설정되지 않았습니다.",
      "NO_API_KEY"
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  let res;
  try {
    res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: instruction }] }],
      config: { responseMimeType: "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    throw new PublishingAgentError(`AI 호출 실패: ${msg || "알 수 없는 오류"}`, "AI_FAILED");
  }

  const text = res.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim();
  if (!text) throw new PublishingAgentError("결과가 비어 있습니다.", "NO_RESULT");

  try {
    return JSON.parse(text);
  } catch {
    throw new PublishingAgentError("결과가 JSON 형식이 아닙니다.", "BAD_JSON");
  }
}
