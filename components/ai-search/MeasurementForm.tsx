'use client';

import { useState } from 'react';
import { AI_SERVICES, QUESTION_CATEGORIES } from '@/lib/ai-search/constants';
import type { AiService, MeasurementMentioned, AiSearchQuestion } from '@/lib/ai-search/types';

interface Props {
  businessId: string;
  businessName: string;
  questions: AiSearchQuestion[];
}

const AI_SERVICE_OPTIONS = Object.entries(AI_SERVICES) as [AiService, string][];

/**
 * 측정 입력 폼 — DB 연결 전 단계.
 * 저장 버튼은 비활성 처리하고 연결 전 안내 배너를 표시한다.
 */
export function MeasurementForm({ businessId, businessName, questions }: Props) {
  const [questionId, setQuestionId] = useState('');
  const [aiService, setAiService] = useState<AiService>('CHATGPT');
  const [aiServiceVersion, setAiServiceVersion] = useState('');
  const [isMentioned, setIsMentioned] = useState<MeasurementMentioned>(null);
  const [answerSummary, setAnswerSummary] = useState('');
  const [sourceUrls, setSourceUrls] = useState('');
  const [notes, setNotes] = useState('');

  const selectedQuestion = questions.find((q) => q.id === questionId);

  return (
    <div className="flex flex-col gap-6">
      {/* DB 연결 전 안내 배너 */}
      <div className="rounded-2xl border border-dashed border-amber-400/60 bg-amber-400/5 p-4">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          DB 연결 전 단계 — 저장 불가
        </p>
        <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
          Supabase 재개 및 DB 마이그레이션 승인 후 실제 저장이 가능합니다.
          현재는 폼 구조와 입력 흐름만 확인할 수 있습니다.
        </p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
        {/* 사업체 */}
        <div className="rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">측정 대상 사업체</p>
          <p className="mt-1 font-semibold">{businessName}</p>
          <input type="hidden" name="businessId" value={businessId} />
        </div>

        {/* 질문 선택 */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="questionId" className="text-sm font-medium">
            진단 질문 <span className="text-red-500">*</span>
          </label>
          {questions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              등록된 질문이 없습니다. 엑셀 파일 제공 후 질문을 등록해 주세요.
            </div>
          ) : (
            <select
              id="questionId"
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">질문을 선택하세요</option>
              {questions
                .filter((q) => q.isActive)
                .map((q) => (
                  <option key={q.id} value={q.id}>
                    [{q.questionCode}] {QUESTION_CATEGORIES[q.category]} — {q.questionText}
                  </option>
                ))}
            </select>
          )}
          {selectedQuestion && (
            <p className="text-xs text-muted-foreground">
              검색 의도: {selectedQuestion.searchIntent}
            </p>
          )}
        </div>

        {/* AI 서비스 */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="aiService" className="text-sm font-medium">
            AI 서비스 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {AI_SERVICE_OPTIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setAiService(key)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  aiService === key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* AI 서비스 버전 */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="aiServiceVersion" className="text-sm font-medium">
            AI 서비스 버전 <span className="text-xs text-muted-foreground">(선택)</span>
          </label>
          <input
            id="aiServiceVersion"
            type="text"
            value={aiServiceVersion}
            onChange={(e) => setAiServiceVersion(e.target.value)}
            placeholder="예: GPT-4o, Gemini 1.5 Pro"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* 언급 여부 — 3상태 */}
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium">
            언급 여부 <span className="text-red-500">*</span>
          </p>
          <p className="text-xs text-muted-foreground">
            AI 서비스에 질문했을 때 이 사업체가 언급되었는지 직접 확인 후 선택하세요.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsMentioned(true)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                isMentioned === true
                  ? 'border-green-500 bg-green-500/10 font-semibold text-green-600'
                  : 'border-border text-muted-foreground hover:border-green-500 hover:text-green-600'
              }`}
            >
              ✓ 언급됨
            </button>
            <button
              type="button"
              onClick={() => setIsMentioned(false)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                isMentioned === false
                  ? 'border-border bg-muted font-semibold text-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
              }`}
            >
              미언급
            </button>
            <button
              type="button"
              onClick={() => setIsMentioned(null)}
              className={`rounded-full border border-dashed px-4 py-1.5 text-sm transition-colors ${
                isMentioned === null
                  ? 'border-border bg-muted/40 text-muted-foreground'
                  : 'border-border/50 text-muted-foreground/50'
              }`}
            >
              입력 안 함 (미측정)
            </button>
          </div>
        </div>

        {/* AI 답변 요약 */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="answerSummary" className="text-sm font-medium">
            AI 답변 요약 <span className="text-xs text-muted-foreground">(선택)</span>
          </label>
          <textarea
            id="answerSummary"
            value={answerSummary}
            onChange={(e) => setAnswerSummary(e.target.value)}
            placeholder="AI가 응답한 내용을 간략히 요약하세요"
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* 출처 URL */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sourceUrls" className="text-sm font-medium">
            출처 URL <span className="text-xs text-muted-foreground">(선택, 줄바꿈으로 구분)</span>
          </label>
          <textarea
            id="sourceUrls"
            value={sourceUrls}
            onChange={(e) => setSourceUrls(e.target.value)}
            placeholder="https://example.com"
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* 측정 조건 메모 */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-sm font-medium">
            측정 조건 메모 <span className="text-xs text-muted-foreground">(선택)</span>
          </label>
          <input
            id="notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="예: 로그인 상태, 지역 설정, 측정 시간 등"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* 저장 버튼 — DB 연결 전이므로 비활성 */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled
            aria-disabled="true"
            className="rounded-lg bg-primary/40 px-6 py-2.5 text-sm font-semibold text-primary-foreground cursor-not-allowed"
          >
            저장
          </button>
          <span className="text-xs text-muted-foreground">
            DB 연결 후 활성화됩니다
          </span>
        </div>
      </form>
    </div>
  );
}
