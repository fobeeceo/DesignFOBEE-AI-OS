-- AI Search 운영 테이블 추가 (Phase 5+7, 2026-10-25)
-- 기존 테이블에 영향 없음. 신규 테이블 7개 추가.

-- AiSearchBusiness: 측정 대상 사업체
CREATE TABLE "ai_search_businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "businessHours" TEXT,
    "websiteUrl" TEXT,
    "naverPlaceUrl" TEXT,
    "googlePlaceUrl" TEXT,
    "instagramUrl" TEXT,
    "menuOrServices" TEXT,
    "priceRange" TEXT,
    "factCheckStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "factCheckedAt" TEXT,
    "factCheckedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_search_businesses_pkey" PRIMARY KEY ("id")
);

-- AiSearchQuestionSnapshot: 질문 버전 이력
CREATE TABLE "ai_search_question_snapshots" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT,
    "searchIntent" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "versionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_search_question_snapshots_pkey" PRIMARY KEY ("id")
);

-- AiSearchRun: 실행 1회 기록
CREATE TABLE "ai_search_runs" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "aiService" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "totalQuestions" INTEGER NOT NULL,
    "mentioned" INTEGER NOT NULL DEFAULT 0,
    "notMentioned" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "mentionRate" DOUBLE PRECISION,
    "triggeredBy" TEXT NOT NULL DEFAULT 'MANUAL',
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_search_runs_pkey" PRIMARY KEY ("id")
);

-- AiSearchResult: 질문 1개 결과
CREATE TABLE "ai_search_results" (
    "id" TEXT NOT NULL,
    "runId_fk" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "mentionStatus" TEXT NOT NULL,
    "answerSummary" TEXT,
    "sourceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidence" TEXT,
    "failureReason" TEXT,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_search_results_pkey" PRIMARY KEY ("id")
);

-- AiImprovementTask: 개선 과제
CREATE TABLE "ai_improvement_tasks" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "relatedQuestionCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "problem" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "contentPlan" TEXT NOT NULL,
    "targetPlatform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignee" TEXT NOT NULL DEFAULT 'AI',
    "customerApproved" BOOLEAN,
    "executedAt" TIMESTAMP(3),
    "verificationResult" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_improvement_tasks_pkey" PRIMARY KEY ("id")
);

-- AiContentDraft: 콘텐츠 초안
CREATE TABLE "ai_content_drafts" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "improvementTaskId" TEXT NOT NULL,
    "targetQuestionCode" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "ceoFeedback" TEXT,
    "customerFeedback" TEXT,
    "factChecked" BOOLEAN NOT NULL DEFAULT false,
    "factCheckItems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publishedAt" TIMESTAMP(3),
    "publishedUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_content_drafts_pkey" PRIMARY KEY ("id")
);

-- AiMonthlyReport: 월간 보고서
CREATE TABLE "ai_monthly_reports" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "reportMonth" TEXT NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "statsSnapshot" JSONB NOT NULL,
    "comparisonSnapshot" JSONB,
    "measurementRunIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "approvedByCeo" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_monthly_reports_pkey" PRIMARY KEY ("id")
);

-- 인덱스
CREATE UNIQUE INDEX "ai_search_question_snapshots_businessId_questionCode_version_key"
    ON "ai_search_question_snapshots"("businessId", "questionCode", "version");
CREATE INDEX "ai_search_question_snapshots_businessId_idx"
    ON "ai_search_question_snapshots"("businessId");

CREATE UNIQUE INDEX "ai_search_runs_runId_key" ON "ai_search_runs"("runId");
CREATE INDEX "ai_search_runs_businessId_startedAt_idx"
    ON "ai_search_runs"("businessId", "startedAt");

CREATE INDEX "ai_search_results_runId_fk_idx" ON "ai_search_results"("runId_fk");
CREATE INDEX "ai_search_results_questionCode_idx" ON "ai_search_results"("questionCode");

CREATE INDEX "ai_improvement_tasks_businessId_idx" ON "ai_improvement_tasks"("businessId");

CREATE UNIQUE INDEX "ai_monthly_reports_businessId_reportMonth_key"
    ON "ai_monthly_reports"("businessId", "reportMonth");
CREATE INDEX "ai_monthly_reports_businessId_idx" ON "ai_monthly_reports"("businessId");

-- 외래키
ALTER TABLE "ai_search_question_snapshots"
    ADD CONSTRAINT "ai_search_question_snapshots_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "ai_search_businesses"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ai_search_runs"
    ADD CONSTRAINT "ai_search_runs_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "ai_search_businesses"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ai_search_results"
    ADD CONSTRAINT "ai_search_results_runId_fk_fkey"
    FOREIGN KEY ("runId_fk") REFERENCES "ai_search_runs"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ai_search_results"
    ADD CONSTRAINT "ai_search_results_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "ai_search_question_snapshots"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ai_improvement_tasks"
    ADD CONSTRAINT "ai_improvement_tasks_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "ai_search_businesses"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ai_content_drafts"
    ADD CONSTRAINT "ai_content_drafts_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "ai_search_businesses"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ai_content_drafts"
    ADD CONSTRAINT "ai_content_drafts_improvementTaskId_fkey"
    FOREIGN KEY ("improvementTaskId") REFERENCES "ai_improvement_tasks"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ai_monthly_reports"
    ADD CONSTRAINT "ai_monthly_reports_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "ai_search_businesses"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
