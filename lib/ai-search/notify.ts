/**
 * AI Search — Discord 알림 헬퍼 (Phase 7)
 * DISCORD_WEBHOOK_URL 미설정 시 silent skip.
 */

import type { AnalystRunResult } from './analyst/types';
import type { SaveResult } from './persistence';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

function isAvailable(): boolean {
  return Boolean(WEBHOOK_URL);
}

function runStatusEmoji(result: AnalystRunResult): string {
  if (result.failed === result.totalQuestions) return '❌';
  if (result.failed > 0) return '⚠️';
  return '✅';
}

/**
 * 측정 실행 완료 알림을 Discord Webhook으로 전송한다.
 * 오류가 발생해도 throws하지 않는다.
 */
export async function notifyRunComplete(
  businessId: string,
  result: AnalystRunResult,
  saveResult: SaveResult,
): Promise<void> {
  if (!isAvailable()) return;

  const emoji = runStatusEmoji(result);
  const rate = result.mentionRate !== null ? `${result.mentionRate}%` : '계산 불가';
  const dbStatus = saveResult.saved ? `저장됨 (id: ${saveResult.runDbId ?? '?'})` : `저장 실패: ${saveResult.reason ?? '알 수 없음'}`;

  const content = [
    `${emoji} **AI Search 측정 완료** — \`${businessId}\``,
    `> 총 ${result.totalQuestions}문항 | 언급 ${result.mentioned} | 미언급 ${result.notMentioned} | 실패 ${result.failed}`,
    `> 언급률: **${rate}** | DB: ${dbStatus}`,
    `> runId: \`${result.runId}\``,
  ].join('\n');

  try {
    const res = await fetch(WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      console.warn('[ai-search/notify] Discord webhook 응답 오류:', res.status);
    }
  } catch (err) {
    console.warn('[ai-search/notify] Discord 알림 실패:', err instanceof Error ? err.message : String(err));
  }
}

/**
 * 측정 실패(API 오류 등) 알림.
 */
export async function notifyRunFailed(businessId: string, runId: string, reason: string): Promise<void> {
  if (!isAvailable()) return;

  const content = [
    `❌ **AI Search 측정 실패** — \`${businessId}\``,
    `> runId: \`${runId}\``,
    `> 사유: ${reason}`,
  ].join('\n');

  try {
    await fetch(WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  } catch {
    // silent
  }
}

export { isAvailable as isDiscordAvailable };
