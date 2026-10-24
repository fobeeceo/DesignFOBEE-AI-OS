import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthError } from '@/lib/auth/requireAdmin';
import { requireServiceOrAdmin } from '@/lib/auth/requireServiceOrAdmin';
import { DEMO_BUSINESSES } from '@/lib/ai-search/constants';
import { runAnalysis, dryRun } from '@/lib/ai-search/analyst/runner';
import type { RunRequest } from '@/lib/ai-search/analyst/types';

export const dynamic = 'force-dynamic';
// Q03 단독 33초 실측 — 20문항 최대 15분 → Vercel Hobby(10초) 부족, Pro(300초) 이상 필요
export const maxDuration = 300;

/**
 * POST /api/hq/ai-search/run
 * body: { businessId, aiService: 'GEMINI', dryRun?: boolean, maxQuestions?: number }
 *
 * Gemini Google Search grounding으로 AI 검색 자동 측정을 실행한다.
 * - 관리자 세션 또는 n8n 서비스 토큰 인증 필요
 * - GEMINI_API_KEY가 없으면 503
 * - dryRun: true면 API 미호출, 구조만 반환
 *
 * Phase 3 제약: 대량 API 호출 금지 — maxQuestions 기본값 1 (안전 기본)
 * 전체 20문항 실행은 대표 승인 후 maxQuestions: 20 으로 호출한다.
 */
export async function POST(req: NextRequest) {
  try {
    await requireServiceOrAdmin(req);

    const body: Partial<RunRequest> = await req.json().catch(() => ({}));
    const { businessId, aiService = 'GEMINI', dryRun: isDryRun = false, maxQuestions = 1, questionCodes } = body;

    if (!businessId) {
      return NextResponse.json({ ok: false, error: 'businessId가 필요합니다.' }, { status: 400 });
    }

    const biz = DEMO_BUSINESSES.find((b) => b.id === businessId);
    if (!biz) {
      return NextResponse.json({ ok: false, error: '존재하지 않는 businessId입니다.' }, { status: 404 });
    }

    if (aiService !== 'GEMINI') {
      return NextResponse.json(
        { ok: false, error: 'Phase 3에서 지원하는 aiService는 GEMINI뿐입니다.' },
        { status: 400 },
      );
    }

    if (isDryRun) {
      const result = dryRun(businessId, maxQuestions);
      return NextResponse.json({ ok: true, dryRun: true, data: result });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: 'GEMINI_API_KEY가 서버에 설정되지 않았습니다.' },
        { status: 503 },
      );
    }

    const capped = Math.min(Math.max(1, maxQuestions ?? 1), 20);
    const result = await runAnalysis(businessId, apiKey, capped, undefined, questionCodes);
    return NextResponse.json({ ok: true, dryRun: false, data: result });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      const status = error.code === 'NOT_LOGGED_IN' ? 401 : 403;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
