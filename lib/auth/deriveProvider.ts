import type { AuthProvider } from "@/types/profile";

/**
 * Supabase user.app_metadata.provider ("google" | "kakao" | "email" | ...) 를
 * 우리 Prisma AuthProvider enum 값으로 변환한다.
 */
export function deriveProvider(rawProvider: string | undefined): AuthProvider {
  switch (rawProvider) {
    case "google":
      return "GOOGLE";
    case "kakao":
      return "KAKAO";
    default:
      return "EMAIL";
  }
}
