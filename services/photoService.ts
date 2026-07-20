import { prisma } from "@/lib/prisma";
import { uploadSpacePhoto } from "@/lib/supabase/storage";
import type { SpacePhoto } from "@/types/project";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_PREFIX = "image/";

function serializePhoto(photo: any): SpacePhoto {
  return { ...photo, createdAt: photo.createdAt.toISOString() };
}

export function validatePhotoFile(file: File) {
  if (!file.type.startsWith(ALLOWED_MIME_PREFIX)) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("파일 크기는 10MB를 초과할 수 없습니다.");
  }
}

/**
 * STEP 3: 사진을 Storage에 올리고 DB 레코드를 생성한다.
 */
export async function addPhotoToProject(params: {
  userId: string;
  projectId: string;
  file: File;
}): Promise<SpacePhoto> {
  validatePhotoFile(params.file);

  const { storagePath, url } = await uploadSpacePhoto(params);

  const photo = await prisma.spacePhoto.create({
    data: {
      projectId: params.projectId,
      storagePath,
      url,
      originalName: params.file.name,
      mimeType: params.file.type,
      sizeBytes: params.file.size,
    },
  });

  return serializePhoto(photo);
}
