import { z } from "zod";

/**
 * 회원가입 폼 검증 스키마.
 */
export const signupSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상 입력해주세요.").max(30, "이름이 너무 깁니다."),
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다.")
    .max(72, "비밀번호가 너무 깁니다."),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

/**
 * 로그인 폼 검증 스키마.
 */
export const loginSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
