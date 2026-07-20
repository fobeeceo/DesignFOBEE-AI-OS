import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

export const SPACE_PHOTOS_BUCKET = "space-photos";
export const DESIGN_IMAGES_BUCKET = "design-images";

interface UploadSpacePhotoParams {
  userId: string;
  projectId: string;
  file: File;
}

/**
 * 공간 사진을 Supabase Storage에 업로드한다. (STEP 3)
 * 경로 규칙: {userId}/{projectId}/{uuid}.{ext}
 * (Storage RLS 정책에서 userId 폴더 기준으로 본인 파일만 쓰도록 제한 — README 참고)
 */
export async function uploadSpacePhoto({ userId, projectId, file }: UploadSpacePhotoParams) {
  const supabase = createClient();

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${userId}/${projectId}/${randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(SPACE_PHOTOS_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`사진 업로드 실패: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(SPACE_PHOTOS_BUCKET).getPublicUrl(path);

  return { storagePath: path, url: data.publicUrl };
}

interface UploadDesignImageParams {
  userId: string;
  projectId: string;
  base64: string;
}

/**
 * STEP 4+5: Gemini가 생성한 base64 결과 이미지를 Storage에 업로드한다.
 * 경로 규칙: {userId}/{projectId}/designs/{uuid}.png
 */
export async function uploadDesignImage({ userId, projectId, base64 }: UploadDesignImageParams) {
  const supabase = createClient();

  const path = `${userId}/${projectId}/designs/${randomUUID()}.png`;
  const buffer = Buffer.from(base64, "base64");

  const { error: uploadError } = await supabase.storage
    .from(DESIGN_IMAGES_BUCKET)
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`결과 이미지 저장 실패: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(DESIGN_IMAGES_BUCKET).getPublicUrl(path);

  return { storagePath: path, url: data.publicUrl };
}
