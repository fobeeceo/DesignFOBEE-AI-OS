import { GoogleGenAI } from "@google/genai";

/**
 * AI CEO(전략) — 경영 의사결정 파트너.
 * Notion AI Prompt Library "AI CEO — 경영 의사결정 파트너" 프롬프트 원문 반영:
 * CEO 철학 10원칙(시스템 설계·문서화·연결·CEO 없이 작동)을 따르며,
 * 단순 실행이 아니라 항상 복수 대안과 반대의견(리스크)을 먼저 제시하고,
 * "이 결정이 CEO 없이도 시스템으로 계속 작동하는가?"를 기준으로 판단한다.
 * AI-STAFF-POLICY.md §4 원칙과 동일: 이 에이전트는 제안까지만 한다(실행 없음).
 */

const MODEL = "gemini-flash-latest";

export class CeoStrategyAgentError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "CeoStrategyAgentError";
  }
}

export interface StrategyRequest {
  decision: string;
  context: string;
}

export interface StrategyAlternative {
  안: string;
  장점: string;
  단점: string;
}

export interface StrategyAnalysis {
  대안: StrategyAlternative[];
  반대의견: string[];
  판단기준_충족여부: string;
  권고: string;
  generatedAt: string;
}

/** 결정 사안에 대해 복수 대안·반대의견·"CEO 없이도 작동하는가" 판단을 생성한다. 실행은 하지 않는다(제안까지). */
export async function generateStrategyAnalysis({ decision, context }: StrategyRequest): Promise<StrategyAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new CeoStrategyAgentError("서버의 GEMINI_API_KEY가 설정되지 않았습니다.", "NO_API_KEY");
  }

  const instruction = `당신은 DesignFOBEE AI OS의 의사결정 파트너입니다. CEO 철학 10원칙(시스템 설계·문서화·연결·CEO 없이 작동)을 따릅니다.
단순 실행 지시가 아니라, 항상 복수 대안과 반대의견(리스크)을 먼저 제시하고, "이 결정이 CEO 없이도 시스템으로 계속 작동하는가?"를 판단 기준으로 삼습니다.

[결정 사안]
${decision}

[배경 정보 — 이 안에 없는 사실은 지어내지 마세요]
${context}

작업:
1. 대안 2~3개를 각각 장단점과 함께 제시.
2. 반대의견(리스크)을 최소 2개 제시 — 낙관적 시나리오만 말하지 마세요.
3. "CEO 없이도 시스템으로 계속 작동하는가?" 기준으로 각 대안을 평가.
4. 하나를 권고하되, 왜 그것인지 판단 기준에 근거해 설명.

아래 JSON 스키마로만 응답(다른 텍스트 금지):
{"대안":[{"안":"","장점":"","단점":""}],"반대의견":[""],"판단기준_충족여부":"","권고":""}`;

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
    throw new CeoStrategyAgentError(`전략 분석 실패: ${msg || "알 수 없는 오류"}`, "ANALYSIS_FAILED");
  }

  const text = res.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim();
  if (!text) {
    throw new CeoStrategyAgentError("분석 결과가 비어 있습니다.", "NO_RESULT");
  }

  let parsed: Omit<StrategyAnalysis, "generatedAt">;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new CeoStrategyAgentError("AI 응답이 JSON 형식이 아닙니다.", "PARSE_FAILED");
  }

  return { generatedAt: new Date().toISOString(), ...parsed };
}
