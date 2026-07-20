import { GoogleGenAI } from "@google/genai";
import { ROOM_TYPES, STYLES } from "@/prompts/interiorStyles";
import { InteriorDesignError } from "@/agents/interiorDesignAgent";

/**
 * STEP 6: AI 설명 생성.
 * STEP 5에서 생성된 결과 이미지를 Gemini 비전 모델에 다시 보여주고,
 * 26년 경력 공간 디자이너 톤의 한국어 설명을 생성한다.
 * 이미지 생성(gemini-3.1-flash-image-preview)과는 별도로 텍스트 모델을 사용한다.
 */

const DESCRIPTION_MODEL = "gemini-flash-latest";

interface GenerateDescriptionParams {
  imageBase64: string;
  mimeType: string;
  roomTypeId: string;
  styleId: string;
}

export async function generateDesignDescription({
  imageBase64,
  mimeType,
  roomTypeId,
  styleId,
}: GenerateDescriptionParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new InteriorDesignError("서버의 GEMINI_API_KEY가 설정되지 않았습니다.", "NO_API_KEY");
  }

  const roomType = ROOM_TYPES.find((r) => r.id === roomTypeId);
  const style = STYLES.find((s) => s.id === styleId);
  if (!roomType || !style) {
    throw new InteriorDesignError("공간 유형과 인테리어 스타일을 선택해 주세요.", "INVALID_OPTION");
  }

  const instruction = `당신은 26년 경력의 공간 디자인 전문가입니다. 아래는 AI로 리디자인된 ${roomType.label} 사진입니다(${style.label} 스타일 적용). 이 사진을 실제로 보고, 반영된 가구·색감·조명·소재 등 구체적인 디자인 요소를 짚어가며 고객에게 전달할 설명을 작성하세요.

조건:
- 한국어로 3문장 내외
- 과장된 광고 문구가 아니라 신뢰감 있는 전문가의 설명 톤
- 이 공간이 어떤 경험/분위기를 주는지도 한 문장 포함
- 문장만 출력하고 다른 텍스트(제목, 목록 기호 등)는 붙이지 않는다`;

  const ai = new GoogleGenAI({ apiKey });

  let res;
  try {
    res = await ai.models.generateContent({
      model: DESCRIPTION_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: instruction }],
        },
      ],
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    throw new InteriorDesignError(`AI 설명 생성 실패: ${msg || "알 수 없는 오류"}`, "DESCRIPTION_FAILED");
  }

  const text = res.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim();

  if (!text) {
    throw new InteriorDesignError("설명 생성에 실패했습니다.", "NO_DESCRIPTION");
  }

  return text;
}
