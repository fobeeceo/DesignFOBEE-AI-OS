import { z } from "zod";

export const leadSchema = z.object({
  name: z
    .string()
    .min(2, "이름은 2자 이상 입력해주세요.")
    .max(30, "이름이 너무 깁니다."),
  phone: z
    .string()
    .regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, "올바른 휴대폰 번호를 입력해주세요."),
  email: z
    .string()
    .email("올바른 이메일 형식이 아닙니다.")
    .optional()
    .or(z.literal("")),
  message: z.string().max(1000, "문의 내용은 1000자 이내로 입력해주세요.").optional(),
  source: z.string().min(1).default("homepage"),
  designImageId: z.string().optional(),
});

export type LeadFormValues = z.infer<typeof leadSchema>;
