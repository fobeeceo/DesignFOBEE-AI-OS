import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthError } from '@/lib/auth/requireAdmin';
import { requireServiceOrAdmin } from '@/lib/auth/requireServiceOrAdmin';
import { DEMO_BUSINESSES } from '@/lib/ai-search/constants';
import { isDbAvailable, getLatestRun } from '@/lib/ai-search/persistence';
import { isDiscordAvailable } from '@/lib/ai-search/notify';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hq/ai-search/status?businessId=gbrick-coffee
 * 채널 상태 + 최근 실행 요약 반환.
 * 관리자 세션 또는 n8n 서비스 토큰 인증 필요.
 */
export async function GET(req: NextRequest) {
  try {
    await requireServiceOrAdmin(req);

    const businessId = req.nextUrl.searchParams.get('businessId');
    if (!businessId) {
      return NextResponse.json({ ok: false, error: 'businessId 파라미터가 필요합니다.' }, { status: 400 });
    }

    const biz = DEMO_BUSINESSES.find((b) => b.id === businessId);
    if (!biz) {
      return NextResponse.json({ ok: false, error: '존재하지 않는 businessId입니다.' }, { status: 404 });
    }

    const latestRun = await getLatestRun(businessId);

    const channels = {
      geminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      database: isDbAvailable(),
      discord: isDiscordAvailable(),
      n8nToken: Boolean(process.env.N8N_SERVICE_TOKEN),
    };

    return NextResponse.json({
      ok: true,
      businessId,
      channels,
      latestRun,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      const status = error.code === 'NOT_LOGGED_IN' ? 401 : 403;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
