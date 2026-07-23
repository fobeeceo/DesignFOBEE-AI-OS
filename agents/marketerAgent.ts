import { GoogleGenAI } from "@google/genai";

/**
 * AI 마케터 — GBRICK 창업/브랜드 마케팅 카피 생성.
 * SSOT(Notion AI Prompt Library "AI 마케터" 프롬프트 원문 반영, 2026-06-23 브랜드가이드와 동일 수치):
 * 총 창업비용 약 8,636만원(66㎡ 기준, 임대 별도) · 3년간 폐점 0건 · 평균 운영 10년 이상 · 상표사용료 면제.
 * 정보공개서 수치 사용 시 법정고지 필수, 과장·허위 금지(타깃: 예비 창업자).
 */

const MODEL = "gemini-flash-latest";

const FRANCHISE_SSOT = `- 총 창업비용: 약 8,636만원(66㎡ 기준, 임대 별도)
- 최근 3년간 폐점: 0건
- 평균 운영 기간: 10년 이상
- 상표사용료: 면제(차액가맹금 방식)
- 브랜드 본질: 공간과 커피를 결합한 브랜드 — 고객은 커피가 아니라 좋은 공간을 경험하러 온다`;

const LEGAL_NOTICE = "* 위 수치는 정보공개서 기준이며 실제와 차이가 있을 수 있습니다. 자세한 사항은 상담을 통해 확인해 주세요.";

export class MarketerAgentError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "MarketerAgentError";
  }
}

export interface MarketingCopyRequest {
  topic: string;
  channel: "instagram" | "blog" | "franchise_landing";
}

export interface MarketingCopyResult {
  copy: string;
  legalNoticeIncluded: boolean;
  generatedAt: string;
}

/** 예비 창업자 타깃 카피를 생성한다. SSOT 밖 수치는 절대 인용하지 않는다(추측 금지). */
export async function generateMarketingCopy({ topic, channel }: MarketingCopyRequest): Promise<MarketingCopyResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new MarketerAgentError("서버의 GEMINI_API_KEY가 설정되지 않았습니다.", "NO_API_KEY");
  }

  const channelSpec: Record<MarketingCopyRequest["channel"], string> = {
    instagram: "인스타그램 캡션(2~3문장, 이모지 최소한)",
    blog: "블로그 서두 문단(400자 내외)",
    franchise_landing: "가맹 상담 페이지 도입부(300자 내외, 신뢰감 강조)",
  };

  const instruction = `당신은 DesignFOBEE/GBRICK의 AI 마케터입니다. 아래 SSOT(정보공개서 기준) 수치만 사용해 "${topic}" 주제로 ${channelSpec[channel]}를 작성하세요. 타깃은 예비 창업자입니다.

[SSOT — 이 수치만 인용 가능, 다른 수치는 지어내지 마세요]
${FRANCHISE_SSOT}

조건:
- 과장된 광고 문구 대신 신뢰감 있는 전문가 톤
- 수익 보장이나 확정적 매출 언급 절대 금지
- 마지막 줄에 반드시 아래 법정고지를 그대로 포함
"${LEGAL_NOTICE}"
- 카피 본문만 출력(제목/설명 등 다른 텍스트 금지)`;

  const ai = new GoogleGenAI({ apiKey });
  let res;
  try {
    res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: instruction }] }],
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    throw new MarketerAgentError(`카피 생성 실패: ${msg || "알 수 없는 오류"}`, "GENERATION_FAILED");
  }

  const text = res.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim();
  if (!text) {
    throw new MarketerAgentError("생성된 카피가 비어 있습니다.", "NO_RESULT");
  }

  return {
    copy: text,
    legalNoticeIncluded: text.includes("정보공개서 기준"),
    generatedAt: new Date().toISOString(),
  };
}
