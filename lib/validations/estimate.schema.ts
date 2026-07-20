import { z } from "zod";

/**
 * POST /api/projects/[projectId]/design/[designImageId]/estimate 요청 검증 스키마.
 */
export const estimateInputSchema = z.object({
  areaSqm: z
    .number({ invalid_type_error: "면적을 숫자로 입력해 주세요." })
    .positive("면적은 0보다 커야 합니다.")
    .max(1000, "면적이 너무 큽니다. 담당자에게 직접 문의해 주세요."),
});

export type EstimateInputValues = z.infer<typeof estimateInputSchema>;
