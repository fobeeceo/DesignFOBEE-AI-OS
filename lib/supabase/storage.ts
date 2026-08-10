import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const SPACE_PHOTOS_BUCKET = "space-photos";
export const DESIGN_IMAGES_BUCKET = "design-images";
/** 공간 상담 도면 — 비공개 버킷. 고객 도면이라 공개 URL을 만들지 않는다. */
export const CONSULT_DRAWINGS_BUCKET = "consult-drawings";

/** 서명 링크 유효기간 30일(대표 결정 2026-08-10). 바쁠 때 놓치거나 나중에 다시 볼 일이 있어서다. */
export const SIGNED_URL_TTL_SECONDS = 30 * 24 * 60 * 60;

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

/**
 * 공간 상담 도면을 비공개 버킷에 올린다.
 * 경로 규칙: {YYYY-MM}/{referenceId}/{uuid}.{ext}
 *
 * ⚠️ 공개 URL을 만들지 않는다. 반환값은 경로뿐이고, 열람은 서명 링크로만 한다.
 *    DB에 경로만 저장하므로 DB가 새더라도 도면 자체는 열리지 않는다.
 */
export async function uploadConsultDrawing(params: {
  referenceId: string;
  file: File;
  index: number;
}): Promise<string> {
  const { referenceId, file, index } = params;
  const supabase = createAdminClient();

  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
  const month = new Date().toISOString().slice(0, 7);
  const path = `${month}/${referenceId}/${String(index + 1).padStart(2, "0")}-${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(CONSULT_DRAWINGS_BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`도면 업로드 실패: ${error.message}`);
  }

  return path;
}

/**
 * 저장된 도면 경로를 기한부 열람 링크로 바꾼다.
 * 실패한 항목은 조용히 건너뛴다 — 링크 하나가 안 만들어졌다고 알림 메일 전체를 막지 않는다.
 */
export async function createConsultDrawingLinks(
  paths: string[]
): Promise<{ path: string; url: string }[]> {
  if (paths.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(CONSULT_DRAWINGS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return [];

  return data.flatMap((item) =>
    item.signedUrl ? [{ path: item.path ?? "", url: item.signedUrl }] : []
  );
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
