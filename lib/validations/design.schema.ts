import { z } from "zod";

/**
 * POST /api/projects/[projectId]/design 요청 검증 스키마.
 */
export const generateDesignSchema = z.object({
  sourcePhotoId: z.string().min(1, "원본 사진을 선택해 주세요."),
  roomTypeId: z.string().min(1, "공간 유형을 선택해 주세요."),
  styleId: z.string().min(1, "인테리어 스타일을 선택해 주세요."),
});

export type GenerateDesignInput = z.infer<typeof generateDesignSchema>;
