import { z } from "zod";

/**
 * STEP 9: 관리자 CRM API 요청 검증 스키마.
 */
export const leadStatusUpdateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "CLOSED"], {
    errorMap: () => ({ message: "올바른 상태값이 아닙니다." }),
  }),
});

export const leadNoteInputSchema = z.object({
  content: z
    .string()
    .min(1, "메모 내용을 입력해주세요.")
    .max(2000, "메모는 2000자 이내로 입력해주세요."),
});

export type LeadStatusUpdateValues = z.infer<typeof leadStatusUpdateSchema>;
export type LeadNoteInputValues = z.infer<typeof leadNoteInputSchema>;
