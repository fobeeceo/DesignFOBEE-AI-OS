import { prisma } from "@/lib/prisma";
import type { AuthProvider, Profile } from "@/types/profile";

interface UpsertProfileInput {
  id: string; // Supabase auth.users.id 와 동일한 값
  name: string;
  phone?: string;
  provider: AuthProvider;
}

/**
 * 회원가입/소셜 로그인 직후 profiles 테이블에 사용자 정보를 저장한다.
 * id는 Supabase auth.users.id를 그대로 사용해 1:1로 연결한다.
 */
export async function upsertProfile(input: UpsertProfileInput): Promise<Profile> {
  const profile = await prisma.profile.upsert({
    where: { id: input.id },
    update: { name: input.name, phone: input.phone },
    create: {
      id: input.id,
      name: input.name,
      phone: input.phone,
      provider: input.provider,
    },
  });

  return {
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
