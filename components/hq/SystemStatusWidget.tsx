'use client';

import { useEffect, useState } from 'react';
import type { LatestRunSummary } from '@/lib/ai-search/persistence';

interface ChannelStatus {
  geminiApiKey: boolean;
  database: boolean;
  discord: boolean;
  n8nToken: boolean;
}

interface StatusResponse {
  ok: boolean;
  channels: ChannelStatus;
  latestRun: LatestRunSummary | null;
  error?: string;
}

type FetchState = 'loading' | 'done' | 'auth' | 'error';

function Dot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={`h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-green-500' : 'bg-red-400'}`} />
      <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </span>
  );
}

function fmtKo(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function SystemStatusWidget({ businessId = 'gbrick-coffee' }: { businessId?: string }) {
  const [state, setState] = useState<FetchState>('loading');
  const [data, setData] = useState<StatusResponse | null>(null);

  useEffect(() => {
    fetch(`/api/hq/ai-search/status?businessId=${businessId}`)
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) { setState('auth'); return; }
        const json: StatusResponse = await res.json();
        setData(json);
        setState(json.ok ? 'done' : 'error');
      })
      .catch(() => setState('error'));
  }, [businessId]);

  if (state === 'loading') {
    return (
      <div className="rounded-2xl border border-border p-5">
        <p className="text-xs text-muted-foreground animate-pulse">시스템 상태 확인 중…</p>
      </div>
    );
  }

  if (state === 'auth') {
    return (
      <div className="rounded-2xl border border-dashed border-amber-400/60 bg-amber-400/5 p-5">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">인증 필요</p>
        <p className="mt-1 text-xs text-muted-foreground">
          로그인 후 시스템 연결 상태를 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  if (state === 'error' || !data?.ok) {
    return (
      <div className="rounded-2xl border border-dashed border-red-400/60 bg-red-400/5 p-5">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">상태 조회 실패</p>
        <p className="mt-1 text-xs text-muted-foreground">{data?.error ?? 'API 오류'}</p>
      </div>
    );
  }

  const { channels, latestRun } = data;
  const statusColor =
    latestRun?.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' :
    latestRun?.status === 'FAILED'    ? 'text-red-500' :
    latestRun?.status === 'PARTIAL'   ? 'text-amber-600 dark:text-amber-400' :
    latestRun?.status === 'RUNNING'   ? 'text-blue-500 animate-pulse' :
    'text-muted-foreground';

  return (
    <div className="rounded-2xl border border-border p-5 flex flex-col gap-4">
      <h2 className="text-sm font-bold">🔌 시스템 연결 상태</h2>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Dot ok={channels.geminiApiKey} label="Gemini API" />
        <Dot ok={channels.database}    label="DB (Supabase)" />
        <Dot ok={channels.discord}     label="Discord 알림" />
        <Dot ok={channels.n8nToken}    label="n8n 자동화" />
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold">최근 AI 검색 실행</p>
        {latestRun ? (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className={`font-semibold ${statusColor}`}>{latestRun.status}</span>
              <span className="text-muted-foreground">총 {latestRun.totalQuestions}문항</span>
              <span className="text-muted-foreground">
                언급 {latestRun.mentioned} / 미언급 {latestRun.notMentioned} / 실패 {latestRun.failed}
              </span>
              {latestRun.mentionRate !== null && (
                <span className="font-semibold text-foreground">언급률 {latestRun.mentionRate}%</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {fmtKo(latestRun.startedAt)} ·{' '}
              {latestRun.triggeredBy === 'SCHEDULE' ? '자동 실행' : '수동 실행'}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {channels.database
              ? '실행 기록 없음 — 측정을 시작해 주세요'
              : 'DB 미연결 — 정적 측정 데이터 사용 중 (Phase 3 실측값)'}
          </p>
        )}
      </div>
    </div>
  );
}
