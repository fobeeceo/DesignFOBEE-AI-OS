import { GoogleGenAI } from "@google/genai";

/**
 * AI 웹디자인 트렌드 전략가 — 경쟁사 홈페이지를 fetch해 텍스트를 추출하고,
 * 우리 홈페이지 현재 구성과 대조해 강점/약점/트렌드요소/실행 제안을 낸다.
 * interiorDescriptionAgent.ts와 동일한 Gemini 텍스트 모델 호출 패턴을 재사용한다.
 */

const MODEL = "gemini-flash-latest";
const MAX_TEXT_CHARS = 8000;

export class DesignTrendError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "DesignTrendError";
  }
}

export interface CompetitorInput {
  name: string;
  url: string;
}

interface AnalyzeParams {
  competitors: CompetitorInput[];
  ourSummary: string;
}

export interface DesignTrendFinding {
  경쟁사: string;
  url: string;
  강점: string[];
  약점: string[];
  트렌드요소: string[];
}

export interface DesignTrendSuggestion {
  우선순위: "P1" | "P2" | "P3";
  제안: string;
  근거: string;
}

export interface DesignTrendReport {
  generatedAt: string;
  분석대상: number;
  접근실패: { name: string; url: string; error: string }[];
  경쟁사분석: DesignTrendFinding[];
  트렌드종합: string[];
  우리대비제안: DesignTrendSuggestion[];
}

async function fetchSiteText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; DesignFOBEE-AI-HQ-Research/1.0)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new DesignTrendError(`${url} 응답 실패 (HTTP ${res.status})`, "FETCH_FAILED");
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

/**
 * 경쟁사 URL 목록 + 우리 홈페이지 요약을 받아 구조화된 분석 리포트를 생성한다.
 * 텍스트 기반 정적 추출이라 JS 렌더링 의존 사이트는 본문이 비거나 부실할 수 있음(한계, 결과에 접근실패로 명시).
 */
export async function analyzeDesignTrends({ competitors, ourSummary }: AnalyzeParams): Promise<DesignTrendReport> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new DesignTrendError("서버의 GEMINI_API_KEY가 설정되지 않았습니다.", "NO_API_KEY");
  }
  if (!competitors.length) {
    throw new DesignTrendError("분석할 경쟁사 URL이 없습니다.", "NO_COMPETITORS");
  }

  const fetched = await Promise.all(
    competitors.map(async (c) => {
      try {
        const text = await fetchSiteText(c.url);
        return { ...c, text, ok: text.length > 100 };
      } catch (error) {
        return { ...c, text: "", ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    })
  );

  const usable = fetched.filter((f) => f.ok);
  const failed = fetched
    .filter((f) => !f.ok)
    .map((f) => ({ name: f.name, url: f.url, error: "error" in f ? f.error! : "본문 텍스트가 너무 짧음(JS 렌더링 사이트일 수 있음)" }));

  if (!usable.length) {
    throw new DesignTrendError(
      "모든 경쟁사 URL에서 텍스트 추출 실패 — 사이트가 JS로 렌더링되거나 접근이 차단됐을 수 있습니다.",
      "ALL_FETCH_FAILED"
    );
  }

  const instruction = `당신은 26년 경력의 UX/웹디자인 전략 컨설턴트입니다. 아래는 인테리어/카페 브랜드 경쟁사 홈페이지에서 추출한 텍스트와, 우리(DesignFOBEE) 홈페이지의 현재 구성 요약입니다.

[우리 홈페이지 현재 구성]
${ourSummary}

[경쟁사 ${usable.length}곳 텍스트 추출]
${usable.map((f, i) => `--- ${i + 1}. ${f.name} (${f.url}) ---\n${f.text}`).join("\n\n")}

작업:
1. 각 경쟁사별로 강점 2-3개, 약점 1-2개, 확인되는 디자인/카피/구조 트렌드 요소를 뽑는다. 텍스트에서 실제 확인되는 사실에만 근거하고 추측하지 않는다.
2. 경쟁사 전체를 종합해 현재 업계 트렌드 3-5개를 정리한다.
3. 우리 홈페이지 대비 실행 가능한 제안을 우선순위(P1/P2/P3)와 근거(왜 지금 중요한지)를 붙여 낸다. 과장 없이.

아래 JSON 스키마로만 응답한다(다른 텍스트·마크다운 금지):
{"경쟁사분석":[{"경쟁사":"","url":"","강점":[""],"약점":[""],"트렌드요소":[""]}],"트렌드종합":[""],"우리대비제안":[{"우선순위":"P1","제안":"","근거":""}]}`;

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
    throw new DesignTrendError(`AI 분석 실패: ${msg || "알 수 없는 오류"}`, "ANALYSIS_FAILED");
  }

  const text = res.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim();
  if (!text) {
    throw new DesignTrendError("분석 결과가 비어 있습니다.", "NO_RESULT");
  }

  let parsed: { 경쟁사분석: DesignTrendFinding[]; 트렌드종합: string[]; 우리대비제안: DesignTrendSuggestion[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new DesignTrendError("AI 응답이 JSON 형식이 아닙니다.", "PARSE_FAILED");
  }

  return {
    generatedAt: new Date().toISOString(),
    분석대상: usable.length,
    접근실패: failed,
    ...parsed,
  };
}
