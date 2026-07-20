import { z } from "zod";

/**
 * POST /api/profile 요청 검증 스키마.
 */
export const profileInputSchema = z.object({
  name: z.string().min(2).max(30),
  phone: z.string().optional(),
  provider: z.enum(["EMAIL", "GOOGLE", "KAKAO", "NAVER"]).default("EMAIL"),
});

export type ProfileInputValues = z.infer<typeof profileInputSchema>;
