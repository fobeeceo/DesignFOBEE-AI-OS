import type { Estimate } from "@/types/estimate";

export interface DesignImage {
  id: string;
  projectId: string;
  sourcePhotoId: string;
  roomType: string;
  style: string;
  storagePath: string;
  url: string;
  description?: string | null;
  createdAt: string;
}

export interface GenerateDesignResult {
  designImage: DesignImage;
  remainingFree: number;
}

/**
 * STEP 8: 상담 신청 화면에서 보여줄 AI 디자인 결과 요약.
 * DesignImage + 원본 사진 URL + 견적(있으면)을 한 번에 담는다.
 */
export interface DesignImageWithEstimate extends DesignImage {
  sourcePhotoUrl: string;
  estimate: Estimate | null;
}
