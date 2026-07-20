export type AuthProvider = "EMAIL" | "GOOGLE" | "KAKAO" | "NAVER";

export interface Profile {
  id: string;
  name: string;
  phone?: string | null;
  provider: AuthProvider;
  createdAt: string;
  updatedAt: string;
}
