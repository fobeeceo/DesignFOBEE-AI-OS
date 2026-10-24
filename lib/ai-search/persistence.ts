/**
 * AI Search — 측정 결과 영구 저장 레이어 (Phase 7)
 * DATABASE_URL 미설정 시 graceful fallback (saved: false).
 * 실제 저장은 Supabase DB 연결 후 활성화.
 */

import { prisma } from '@/lib/prisma';
import { QUESTIONS } from './questions';
import type { AnalystRunResult } from './analyst/types';

const AI_MODEL = 'gemini-3.8-flash';
const TIMEOUT_MS = 45_000;
const RUNNING_TTL_MS = 10 * 60 * 1000; // 10분 내 RUNNING 상태면 중복 실행 차단

export interface SaveResult {
  saved: boolean;
  runDbId?: string;
  reason?: string;
}

export interface LatestRunSummary {
  runId: string;
  runDbId: string;
  status: string;
  totalQuestions: number;
  mentioned: number;
  notMentioned: number;
  failed: number;
  mentionRate: number | null;
  startedAt: string;
  finishedAt: string | null;
  triggeredBy: string;
}

export function isDbAvailable(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * 측정 실행 결과 전체를 DB에 저장한다.
 * AiSearchBusiness → AiSearchQuestionSnapshot → AiSearchRun → AiSearchResult 순서로 upsert/create.
 * runId UNIQUE 제약으로 동일 runId 재저장을 무시(upsert update: {}).
 */
export async function saveRunResult(
  businessId: string,
  businessName: string,
  result: AnalystRunResult,
  triggeredBy: 'MANUAL' | 'SCHEDULE' = 'MANUAL',
): Promise<SaveResult> {
  if (!isDbAvailable()) {
    return { saved: false, reason: 'DATABASE_URL 미설정' };
  }

  try {
    // 1. 사업체 레코드 ensure
    await prisma.aiSearchBusiness.upsert({
      where: { id: businessId },
      update: {},
      create: {
        id: businessId,
        name: businessName,
        businessType: '카페',
        brand: 'GBRICK Coffee',
        factCheckStatus: 'PENDING',
        isActive: true,
      },
    });

    // 2. 결과에 포함된 질문별 스냅샷 ensure
    const snapshotIdMap = new Map<string, string>();

    for (const r of result.results) {
      const q = QUESTIONS.find((q) => q.questionCode === r.questionCode);
      if (!q) continue;

      const snapshot = await prisma.aiSearchQuestionSnapshot.upsert({
        where: {
          businessId_questionCode_version: {
            businessId,
            questionCode: r.questionCode,
            version: 1,
          },
        },
        update: { questionText: q.questionText },
        create: {
          businessId,
          questionCode: r.questionCode,
          questionText: q.questionText,
          category: q.category,
          region: q.region ?? null,
          searchIntent: q.searchIntent,
          version: 1,
          isActive: q.isActive,
        },
      });
      snapshotIdMap.set(r.questionCode, snapshot.id);
    }

    // 3. AiSearchRun 생성 (runId UNIQUE — 재시도 시 update: {} 로 dedup)
    const runStatus =
      result.failed === 0
        ? 'COMPLETED'
        : result.failed < result.totalQuestions
          ? 'PARTIAL'
          : 'FAILED';

    const run = await prisma.aiSearchRun.upsert({
      where: { runId: result.runId },
      update: {},
      create: {
        runId: result.runId,
        businessId,
        aiService: result.aiService,
        aiModel: AI_MODEL,
        status: runStatus,
        totalQuestions: result.totalQuestions,
        mentioned: result.mentioned,
        notMentioned: result.notMentioned,
        failed: result.failed,
        mentionRate: result.mentionRate,
        triggeredBy,
        timeoutMs: TIMEOUT_MS,
        startedAt: new Date(result.startedAt),
        finishedAt: result.finishedAt ? new Date(result.finishedAt) : undefined,
      },
    });

    // 4. 질문별 결과 저장
    for (const r of result.results) {
      const questionId = snapshotIdMap.get(r.questionCode);
      if (!questionId) continue;

      await prisma.aiSearchResult.create({
        data: {
          runId_fk: run.id,
          questionId,
          questionCode: r.questionCode,
          mentionStatus: r.mentionStatus,
          answerSummary: r.answerSummary || null,
          sourceUrls: r.sourceUrls,
          evidence: r.evidence ?? null,
          failureReason: r.failureReason ?? null,
          measuredAt: new Date(r.measuredAt),
        },
      });
    }

    return { saved: true, runDbId: run.id };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error('[ai-search/persistence] saveRunResult 실패:', reason);
    return { saved: false, reason };
  }
}

/** 가장 최근 실행 요약을 반환한다. DB 없거나 오류 시 null. */
export async function getLatestRun(businessId: string): Promise<LatestRunSummary | null> {
  if (!isDbAvailable()) return null;

  try {
    const run = await prisma.aiSearchRun.findFirst({
      where: { businessId },
      orderBy: { startedAt: 'desc' },
    });

    if (!run) return null;

    return {
      runId: run.runId,
      runDbId: run.id,
      status: run.status,
      totalQuestions: run.totalQuestions,
      mentioned: run.mentioned,
      notMentioned: run.notMentioned,
      failed: run.failed,
      mentionRate: run.mentionRate,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
      triggeredBy: run.triggeredBy,
    };
  } catch (err) {
    console.error('[ai-search/persistence] getLatestRun 실패:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * 새 실행 시작 가능 여부 확인.
 * RUNNING 상태 런이 RUNNING_TTL_MS 이내 존재하면 중복 차단.
 * DB 없거나 오류 시 허용(낙관적 기본값).
 */
export async function canStartNewRun(businessId: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!isDbAvailable()) return { allowed: true };

  try {
    const running = await prisma.aiSearchRun.findFirst({
      where: { businessId, status: 'RUNNING' },
      orderBy: { startedAt: 'desc' },
    });

    if (running) {
      const elapsed = Date.now() - running.startedAt.getTime();
      if (elapsed < RUNNING_TTL_MS) {
        return { allowed: false, reason: `이미 실행 중인 런이 있습니다 (runId: ${running.runId})` };
      }
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}
