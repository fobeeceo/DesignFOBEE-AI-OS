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

/**
 * /franchise 가맹상담 전용 확장 스키마 — CEO 업무지시(GBRICK 가맹상담 시스템 구축).
 * 기존 leadSchema 필드는 그대로 상속하고, 가맹상담에만 필요한 필드를 추가한다.
 * privacyConsent는 체크 안 하면 제출 자체가 막히도록 literal(true)로 강제한다.
 */
export const franchiseLeadSchema = leadSchema.extend({
  preferredRegion: z.string().max(50).optional(),
  plannedTiming: z.string().max(50).optional(),
  expectedInvestment: z.string().max(50).optional(),
  currentOccupation: z.string().max(50).optional(),
  hasStorefront: z.boolean().optional(),
  consultationPurpose: z.string().max(50).optional(),
  privacyConsent: z.literal(true, {
    errorMap: () => ({ message: "개인정보 수집·이용에 동의해주세요." }),
  }),
});

export type FranchiseLeadFormValues = z.infer<typeof franchiseLeadSchema>;

/**
 * /consult 공간 상담 전용 스키마.
 *
 * 기존 leads 테이블을 재사용하되 source='space_consult'로 구분한다.
 * 공간 상담 고유 항목(공간 유형·현재 상태·면적)은 별도 컬럼을 더 만들지 않고
 * message에 정리해 붙인다 — 상담 1건에 컬럼 3개를 더 만들 만큼 조회 요구가 없고,
 * 컬럼이 늘수록 CRM 화면과 마이그레이션 부담이 함께 늘기 때문이다.
 *
 * ⚠️ 파일은 여기서 검증하지 않는다. FormData의 File은 zod로 다루기 번거로워
 *    라우트에서 별도 함수(validateDrawings)로 검사한다.
 */
export const spaceConsultSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상 입력해주세요.").max(30, "이름이 너무 깁니다."),
  phone: z
    .string()
    .regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, "올바른 휴대폰 번호를 입력해주세요."),
  email: z.string().email("올바른 이메일 형식이 아닙니다.").optional().or(z.literal("")),
  spaceType: z.string().min(1, "공간 유형을 선택해주세요.").max(30),
  spaceState: z.string().min(1, "현재 상태를 선택해주세요.").max(30),
  area: z.string().max(50).optional().or(z.literal("")),
  region: z.string().min(1, "지역을 입력해주세요.").max(50),
  timing: z.string().max(30).optional().or(z.literal("")),
  message: z.string().max(1000, "내용은 1000자 이내로 입력해주세요.").optional().or(z.literal("")),
  privacyConsent: z.literal(true, {
    errorMap: () => ({ message: "개인정보 수집·이용에 동의해주세요." }),
  }),
});

export type SpaceConsultValues = z.infer<typeof spaceConsultSchema>;
