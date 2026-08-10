-- 공간 상담(/consult) 도면 첨부 경로 저장용 컬럼.
-- 추가 전용이며 기존 행은 빈 배열이 기본값으로 들어간다.
-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];
