import { GoogleGenAI } from "@google/genai";
import { ROOM_TYPES, STYLES, buildRedesignInstruction } from "@/prompts/interiorStyles";

/**
 * STEP 4+5: AI 공간분석(사용자가 고른 공간유형) + AI 인테리어 이미지 생성.
 * ReRoom AI 프로토타입의 Gemini 호출 로직을 그대로 이식했다.
 * 모델: gemini-3.1-flash-image-preview (Nano Banana 2)
 */

interface GenerateInteriorDesignParams {
  imageBase64: string;
  mimeType: string;
  roomTypeId: string;
  styleId: string;
}

export class InteriorDesignError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "InteriorDesignError";
  }
}

/** 공통 Gemini 이미지 편집 호출. generate(스타일 프롬프트)와 refine(자연어 지시)이 함께 쓴다. */
async function callGeminiImageEdit(imageBase64: string, mimeType: string, instruction: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new InteriorDesignError("서버의 GEMINI_API_KEY가 설정되지 않았습니다.", "NO_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  let res;
  try {
    res = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        {
          role: "user",
          parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: instruction }],
        },
      ],
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("API_KEY_INVALID") || msg.toLowerCase().includes("invalid api key")) {
      throw new InteriorDesignError("Gemini API 키가 잘못되었습니다.", "INVALID_API_KEY");
    }
    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota") || msg.includes("429")) {
      throw new InteriorDesignError("API 요청 할당량을 초과했습니다. 잠시 후 다시 시도해 주세요.", "QUOTA_EXCEEDED");
    }
    throw new InteriorDesignError(`AI 이미지 생성 실패: ${msg || "알 수 없는 오류"}`, "UNKNOWN");
  }

  const candidate = res.candidates?.[0];

  if (candidate?.finishReason === "SAFETY") {
    throw new InteriorDesignError("안전 정책에 의해 이미지 생성이 차단되었습니다. 다른 사진을 사용해 주세요.", "SAFETY_BLOCKED");
  }

  const part = candidate?.content?.parts?.find((p) => p.inlineData);
  const resultBase64 = part?.inlineData?.data;

  if (!resultBase64) {
    throw new InteriorDesignError("이미지 생성이 실패했거나 차단되었습니다. 다른 공간 유형이나 스타일을 선택해 주세요.", "NO_RESULT");
  }

  return resultBase64;
}

export async function generateInteriorDesign({
  imageBase64,
  mimeType,
  roomTypeId,
  styleId,
}: GenerateInteriorDesignParams): Promise<string> {
  const roomType = ROOM_TYPES.find((r) => r.id === roomTypeId);
  const style = STYLES.find((s) => s.id === styleId);
  if (!roomType || !style) {
    throw new InteriorDesignError("공간 유형과 인테리어 스타일을 선택해 주세요.", "INVALID_OPTION");
  }

  const instruction = buildRedesignInstruction(roomType, style);
  return callGeminiImageEdit(imageBase64, mimeType, instruction);
}

interface RefineInteriorDesignParams {
  imageBase64: string;
  mimeType: string;
  /** 사용자가 자연어로 입력한 수정 요청 (예: "소파를 더 밝은 색으로 바꿔줘") */
  userInstruction: string;
}

/**
 * 대화형 리파인: 이미 생성된 렌더링 결과에 사용자의 자연어 지시를 한 번 더 반영한다.
 * 방 구조·카메라 시점은 그대로 두고 지시한 부분만 바꾸도록 프롬프트로 제약한다.
 */
export async function refineInteriorDesign({
  imageBase64,
  mimeType,
  userInstruction,
}: RefineInteriorDesignParams): Promise<string> {
  const trimmed = userInstruction.trim();
  if (!trimmed) {
    throw new InteriorDesignError("어떻게 수정할지 입력해 주세요.", "INVALID_OPTION");
  }

  const instruction = `Apply this change to the interior photo: "${trimmed}". Keep the room architecture — walls, windows, doors, ceiling and camera perspective — exactly the same, and keep everything else about the current design unchanged unless the instruction says otherwise. Photorealistic interior photography, high detail.`;

  return callGeminiImageEdit(imageBase64, mimeType, instruction);
}
