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

/**
 * STEP 11: 관리자 AI 상담 요약 영역 저장. 세 필드 모두 선택이며,
 * 보낸 필드만 갱신한다(빈 문자열은 "지움"으로 처리).
 */
export const leadAiMemoSchema = z
  .object({
    aiSummary: z.string().max(1000, "상담 요약은 1000자 이내로 입력해주세요.").optional(),
    nextAction: z.string().max(500, "다음 액션은 500자 이내로 입력해주세요.").optional(),
    aiMemo: z.string().max(2000, "AI 메모는 2000자 이내로 입력해주세요.").optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "저장할 내용이 없습니다." }
  );

export type LeadStatusUpdateValues = z.infer<typeof leadStatusUpdateSchema>;
export type LeadNoteInputValues = z.infer<typeof leadNoteInputSchema>;
export type LeadAiMemoValues = z.infer<typeof leadAiMemoSchema>;
