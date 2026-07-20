import { prisma } from "@/lib/prisma";
import { upsertProfile } from "@/services/profileService";
import type { AuthProvider } from "@/types/profile";
import type { Project } from "@/types/project";

interface CurrentUser {
  id: string;
  name: string;
  provider: AuthProvider;
}

function serializeProject(project: any): Project {
  return {
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    photos: (project.photos ?? []).map((p: any) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

/**
 * 소셜 로그인(Google/Kakao/Naver)은 콜백에서 프로필을 만들지 않는 경로가 있을 수 있어
 * Project 생성 직전에 항상 upsert로 안전망을 둔다. (idempotent — 있으면 갱신 없이 통과)
 */
export async function ensureProfile(user: CurrentUser) {
  await upsertProfile({ id: user.id, name: user.name, provider: user.provider });
}

/**
 * STEP 3: 사진 업로드 세션(Project)을 생성한다.
 */
export async function createProject(user: CurrentUser, title?: string): Promise<Project> {
  await ensureProfile(user);

  const project = await prisma.project.create({
    data: { profileId: user.id, title },
    include: { photos: true },
  });

  return serializeProject(project);
}

/**
 * 프로젝트 소유자 확인 + 조회 (사진 목록 포함).
 */
export async function getProjectForUser(projectId: string, userId: string): Promise<Project | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, profileId: userId },
    include: { photos: { orderBy: { createdAt: "asc" } } },
  });

  return project ? serializeProject(project) : null;
}
