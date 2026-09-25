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

/**
 * POST /api/projects/[projectId]/design/[designImageId]/refine 요청 검증 스키마.
 */
export const refineDesignSchema = z.object({
  instruction: z
    .string()
    .trim()
    .min(2, "어떻게 수정할지 조금 더 자세히 입력해 주세요.")
    .max(200, "200자 이내로 입력해 주세요."),
});

export type RefineDesignInput = z.infer<typeof refineDesignSchema>;
