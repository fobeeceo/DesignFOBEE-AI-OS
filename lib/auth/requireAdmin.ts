import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export class AdminAuthError extends Error {
  code: "NOT_LOGGED_IN" | "NOT_ADMIN";

  constructor(message: string, code: "NOT_LOGGED_IN" | "NOT_ADMIN") {
    super(message);
    this.name = "AdminAuthError";
    this.code = code;
  }
}

export interface AdminProfile {
  id: string;
  name: string;
}

/**
 * OS 권한 역할. Master DB의 memberships.role과 정렬된다.
 * (Sprint 2: 아직 memberships 테이블이 없으므로 Profile.isAdmin 폴백으로 판정)
 */
export type Role = "OWNER" | "ADMIN" | "AGENT" | "VIEWER";

/**
 * 역할 기반 권한 게이트.
 * - OWNER / ADMIN → 현행 Profile.isAdmin = true 필요 (기존 관리자 동작 그대로).
 * - AGENT / VIEWER → 로그인만 요구 (향후 세분화 예정).
 *
 * ⚠️ 실제 Role/Tenant 판정(memberships·moduleScope·RLS)은 Core DB(Phase 3)에서 도입된다.
 * 그때 이 함수 "내부"만 교체하며, 호출부 시그니처는 유지한다.
 */
export async function requireRole(minRole: Role = "ADMIN"): Promise<AdminProfile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AdminAuthError("로그인이 필요합니다.", "NOT_LOGGED_IN");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, isAdmin: true },
  });

  if (!profile) {
    throw new AdminAuthError("관리자 권한이 없습니다.", "NOT_ADMIN");
  }

  const needsAdmin = minRole === "OWNER" || minRole === "ADMIN";
  if (needsAdmin && !profile.isAdmin) {
    throw new AdminAuthError("관리자 권한이 없습니다.", "NOT_ADMIN");
  }

  return { id: profile.id, name: profile.name };
}

/**
 * STEP 9: 관리자 전용 API(app/api/admin/**)에서 공통으로 사용하는 권한 체크.
 * requireRole("ADMIN")로 위임되어 기존 동작(로그인 → isAdmin)이 그대로 보존된다.
 * ⚠️ 관리자 계정 지정은 DB에서 Profile.isAdmin을 직접 true로 바꿔야 한다 (STEP10 이전까지는 UI 없음).
 */
export async function requireAdmin(): Promise<AdminProfile> {
  return requireRole("ADMIN");
}
