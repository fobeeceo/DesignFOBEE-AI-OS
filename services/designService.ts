import { prisma } from "@/lib/prisma";
import { uploadDesignImage } from "@/lib/supabase/storage";
import { generateInteriorDesign, InteriorDesignError } from "@/agents/interiorDesignAgent";
import { generateDesignDescription } from "@/agents/interiorDescriptionAgent";
import { FREE_GENERATIONS_PER_USER } from "@/prompts/interiorStyles";
import type { DesignImage, DesignImageWithEstimate, GenerateDesignResult } from "@/types/design";

function serializeDesignImage(d: any): DesignImage {
  return { ...d, createdAt: d.createdAt.toISOString() };
}

/**
 * 로그인 사용자의 남은 무료 생성 횟수를 조회한다.
 * (결제/구독이 붙기 전까지는 평생 무료 횟수로 관리 — STEP 7 예상견적 이후 확장 예정)
 */
export async function getRemainingFreeGenerations(profileId: string): Promise<number> {
  const used = await prisma.designGeneration.count({ where: { profileId } });
  return Math.max(0, FREE_GENERATIONS_PER_USER - used);
}

interface GenerateDesignParams {
  userId: string;
  projectId: string;
  sourcePhotoId: string;
  roomTypeId: string;
  styleId: string;
}

/**
 * STEP 4+5 핵심 orchestration:
 * 1) 사용량 체크 → 2) 원본 사진 조회/권한확인 → 3) Gemini 생성 → 4) Storage 저장 → 5) DB 기록
 */
export async function generateDesignForProject(params: GenerateDesignParams): Promise<GenerateDesignResult> {
  const remaining = await getRemainingFreeGenerations(params.userId);
  if (remaining <= 0) {
    throw new InteriorDesignError(
      `무료 체험 횟수(${FREE_GENERATIONS_PER_USER}회)를 모두 사용하셨습니다. 담당자와 상담을 통해 계속 이용하실 수 있습니다.`,
      "FREE_LIMIT_EXCEEDED"
    );
  }

  const photo = await prisma.spacePhoto.findFirst({
    where: { id: params.sourcePhotoId, projectId: params.projectId, project: { profileId: params.userId } },
  });

  if (!photo) {
    throw new InteriorDesignError("원본 사진을 찾을 수 없습니다.", "PHOTO_NOT_FOUND");
  }

  // 원본 사진(Supabase 공개 URL)을 서버에서 내려받아 base64로 변환
  const photoRes = await fetch(photo.url);
  if (!photoRes.ok) {
    throw new InteriorDesignError("원본 사진을 불러오지 못했습니다.", "PHOTO_FETCH_FAILED");
  }
  const photoBuffer = Buffer.from(await photoRes.arrayBuffer());
  const imageBase64 = photoBuffer.toString("base64");
  const mimeType = photo.mimeType || "image/jpeg";

  const resultBase64 = await generateInteriorDesign({
    imageBase64,
    mimeType,
    roomTypeId: params.roomTypeId,
    styleId: params.styleId,
  });

  const { storagePath, url } = await uploadDesignImage({
    userId: params.userId,
    projectId: params.projectId,
    base64: resultBase64,
  });

  const [designImage] = await prisma.$transaction([
    prisma.designImage.create({
      data: {
        projectId: params.projectId,
        sourcePhotoId: params.sourcePhotoId,
        roomType: params.roomTypeId,
        style: params.styleId,
        storagePath,
        url,
      },
    }),
    prisma.designGeneration.create({ data: { profileId: params.userId } }),
    prisma.project.update({ where: { id: params.projectId }, data: { status: "DESIGNED" } }),
  ]);

  return {
    designImage: serializeDesignImage(designImage),
    remainingFree: remaining - 1,
  };
}

interface GenerateDescriptionParams {
  userId: string;
  projectId: string;
  designImageId: string;
}

/**
 * STEP 6: 이미 생성된 DesignImage에 대해 AI 설명을 만들어 저장한다.
 * 이미지 생성과 분리된 별도 호출로 두어(모듈화 원칙), 설명 생성이 느려도
 * STEP 5 결과 표시는 즉시 이루어지게 한다.
 */
export async function generateDescriptionForDesignImage(params: GenerateDescriptionParams): Promise<string> {
  const designImage = await prisma.designImage.findFirst({
    where: { id: params.designImageId, projectId: params.projectId, project: { profileId: params.userId } },
  });

  if (!designImage) {
    throw new InteriorDesignError("결과 이미지를 찾을 수 없습니다.", "DESIGN_IMAGE_NOT_FOUND");
  }

  if (designImage.description) {
    return designImage.description;
  }

  const imageRes = await fetch(designImage.url);
  if (!imageRes.ok) {
    throw new InteriorDesignError("결과 이미지를 불러오지 못했습니다.", "IMAGE_FETCH_FAILED");
  }
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  const imageBase64 = imageBuffer.toString("base64");

  const description = await generateDesignDescription({
    imageBase64,
    mimeType: "image/png",
    roomTypeId: designImage.roomType,
    styleId: designImage.style,
  });

  await prisma.designImage.update({
    where: { id: designImage.id },
    data: { description },
  });

  return description;
}

/**
 * STEP 8: 상담 신청 화면에서 보여줄 AI 디자인 결과 요약(이미지+설명+견적)을 조회한다.
 * 소유자(profileId) 확인을 포함하며, 본인 프로젝트가 아니면 null을 반환한다.
 */
export async function getDesignImageWithEstimate(
  designImageId: string,
  userId: string
): Promise<DesignImageWithEstimate | null> {
  const designImage = await prisma.designImage.findFirst({
    where: { id: designImageId, project: { profileId: userId } },
    include: { estimate: true, sourcePhoto: true },
  });

  if (!designImage) {
    return null;
  }

  const { estimate, sourcePhoto, ...rest } = designImage as any;

  return {
    ...serializeDesignImage(rest),
    sourcePhotoUrl: sourcePhoto.url,
    estimate: estimate
      ? { ...estimate, createdAt: estimate.createdAt.toISOString() }
      : null,
  };
}
