'use client';

import { useState } from 'react';
import type { AnalystRunResult } from '@/lib/ai-search/analyst/types';

interface Props {
  businessId: string;
}

type RunPhase = 'idle' | 'running' | 'done' | 'error';

export function RunButton({ businessId }: Props) {
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [result, setResult] = useState<AnalystRunResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(null);

  async function handleRun(isDryRun: boolean) {
    setPhase('running');
    setResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/hq/ai-search/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          aiService: 'GEMINI',
          dryRun: isDryRun,
          maxQuestions: isDryRun ? 20 : 1,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }

      setResult(json.data as AnalystRunResult);
      setDbAvailable(json.dbAvailable ?? null);
      setPhase('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '알 수 없는 오류');
      setPhase('error');
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          onClick={() => handleRun(true)}
          disabled={phase === 'running'}
          className="rounded-lg border border-dashed border-blue-400/60 bg-blue-400/5 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-400/10 disabled:opacity-50 transition-colors"
        >
          {phase === 'running' ? '실행 중…' : '드라이런 (API 미호출)'}
        </button>
        <button
          onClick={() => handleRun(false)}
          disabled={phase === 'running'}
          className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
        >
          {phase === 'running' ? '실행 중…' : 'Gemini 1문항 측정'}
        </button>
      </div>

      {phase === 'running' && (
        <p className="text-xs text-muted-foreground animate-pulse">Gemini Google Search 조회 중…</p>
      )}

      {phase === 'error' && (
        <p className="text-xs text-red-600 dark:text-red-400">오류: {errorMsg}</p>
      )}

      {phase === 'done' && result && (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="font-semibold">측정 완료 — {result.runId}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            총 {result.totalQuestions}문항 · 언급 {result.mentioned} · 미언급 {result.notMentioned} · 실패 {result.failed}
          </p>
          {result.mentionRate !== null && (
            <p className="mt-1 text-xs font-semibold text-primary">
              언급률: {result.mentionRate}%
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            DB:{' '}
            {dbAvailable === null
              ? '확인 중'
              : dbAvailable
              ? '저장 예약됨 (비동기)'
              : '미연결 — 저장 없음'}
          </p>
          <ul className="mt-3 space-y-1">
            {result.results.map((r) => (
              <li key={r.questionId} className="flex items-start gap-2 text-xs">
                <span className={`shrink-0 font-mono ${
                  r.mentionStatus === 'MENTIONED' ? 'text-green-600 dark:text-green-400' :
                  r.mentionStatus === 'NOT_MENTIONED' ? 'text-muted-foreground' :
                  r.mentionStatus === 'FAILED' ? 'text-red-500' :
                  'text-amber-500'
                }`}>
                  {r.questionCode}
                </span>
                <span className="text-muted-foreground">{r.questionText.slice(0, 40)}</span>
                <span className={`ml-auto shrink-0 ${
                  r.mentionStatus === 'MENTIONED' ? 'text-green-600 dark:text-green-400' :
                  r.mentionStatus === 'FAILED' ? 'text-red-500' :
                  'text-muted-foreground'
                }`}>
                  {r.mentionStatus === 'MENTIONED' ? '언급' :
                   r.mentionStatus === 'NOT_MENTIONED' ? '미언급' :
                   r.mentionStatus === 'FAILED' ? '실패' : '미측정'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
