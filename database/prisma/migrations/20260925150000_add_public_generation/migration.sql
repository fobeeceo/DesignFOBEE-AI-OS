-- 공개 AI 스튜디오(/design, 로그인 없음)의 실사용 로그 테이블. 신규 테이블 추가 전용이라
-- 기존 데이터에는 영향이 없다.
-- CreateTable
CREATE TABLE "public_generations" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "byok" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_generations_pkey" PRIMARY KEY ("id")
);
