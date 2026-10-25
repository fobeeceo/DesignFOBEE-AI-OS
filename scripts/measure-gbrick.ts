/**
 * GBRICK Coffee AI 검색 실측 스크립트
 * - 실행: tsx scripts/measure-gbrick.ts (프로젝트 루트에서)
 * - API 키: process.env.GEMINI_API_KEY (반드시 .env.local 로드 후 실행)
 * - 결과: data/ai-search/gbrick/ 에 저장
 *
 * §0-2 원칙 준수:
 * - API 키 절대 출력 금지
 * - 원본 응답 전문 보존
 * - 실패/성공 구분 명확
 */

import { GoogleGenAI } from '@google/genai';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ── 프로젝트 모듈 임포트 ─────────────────────────────────────────────────
import { QUESTIONS } from '../lib/ai-search/questions';
import { detectMention } from '../lib/ai-search/analyst/mentionDetector';

// ── 상수 ─────────────────────────────────────────────────────────────────
const MODEL = 'gemini-3.8-flash';
const TIMEOUT_MS = 45_000;
const MAX_RETRIES = 1;
const INTER_QUESTION_DELAY_MS = 500;
const OUTPUT_DIR = join(process.cwd(), 'data/ai-search/gbrick');
const REPORTS_DIR = join(OUTPUT_DIR, 'reports');

// ── 타입 ─────────────────────────────────────────────────────────────────
interface RawResult {
  questionId: string;
  questionCode: string;
  questionText: string;
  category: string;
  region?: string;
  searchIntent: string;
  aiService: 'GEMINI';
  model: string;
  mentionStatus: 'MENTIONED' | 'NOT_MENTIONED' | 'FAILED' | 'INVALID';
  answerFull: string;        // 원본 응답 전문
  answerSummary: string;     // 앞 200자
  sourceUrls: string[];
  evidence?: string;
  failureReason?: string;
  measuredAt: string;
  responseTimeMs: number;
  retryCount: number;
}

interface RunMeta {
  measurementRunId: string;
  businessId: string;
  businessName: string;
  startedAt: string;
  finishedAt: string;
  model: string;
  questionSetVersion: string;
  totalQuestions: number;
  completed: number;
  failed: number;
  mentioned: number;
  notMentioned: number;
  mentionRate: number | null;
  generalMentionRate: number | null;
  brandMentionRate: number | null;
  dbSaved: boolean;
  dbSaveNote: string;
  outputDir: string;
}

// ── API 호출 ──────────────────────────────────────────────────────────────
function sanitizeError(msg: string): string {
  return msg.replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED]');
}

async function callGeminiSearch(
  question: string,
  apiKey: string,
): Promise<{ answerText: string; sourceUrls: string[]; retryCount: number }> {
  const ai = new GoogleGenAI({ apiKey });
  let lastError: Error | null = null;
  let retryCount = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) retryCount = attempt;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(new Error(`응답 시간 초과 (${TIMEOUT_MS}ms)`)),
      TIMEOUT_MS,
    );

    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: question }] }],
        config: {
          tools: [{ googleSearch: {} }],
          abortSignal: controller.signal,
        } as Record<string, unknown>,
      });
      clearTimeout(timeoutId);

      const answerText =
        (res as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
          .candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim() ?? '';

      const chunks =
        (res as { candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string } }> } }> })
          .candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

      const sourceUrls = chunks
        .map((c) => c.web?.uri)
        .filter((u): u is string => Boolean(u));

      return { answerText, sourceUrls, retryCount };
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
      if (!lastError.message.includes('시간 초과') && !lastError.message.includes('abort')) {
        throw lastError;
      }
      // 타임아웃이면 재시도
    }
  }
  throw lastError!;
}

// ── 질문 1개 측정 ─────────────────────────────────────────────────────────
async function measureOne(
  q: (typeof QUESTIONS)[number],
  apiKey: string,
): Promise<RawResult> {
  const measuredAt = new Date().toISOString();
  const startMs = Date.now();

  try {
    const { answerText, sourceUrls, retryCount } = await callGeminiSearch(q.questionText, apiKey);
    const responseTimeMs = Date.now() - startMs;

    if (!answerText) {
      return {
        questionId: q.id,
        questionCode: q.questionCode,
        questionText: q.questionText,
        category: q.category,
        region: (q as { region?: string }).region,
        searchIntent: q.searchIntent,
        aiService: 'GEMINI',
        model: MODEL,
        mentionStatus: 'FAILED',
        answerFull: '',
        answerSummary: '',
        sourceUrls,
        failureReason: 'API가 빈 응답을 반환했습니다.',
        measuredAt,
        responseTimeMs,
        retryCount,
      };
    }

    const detection = detectMention(answerText);

    return {
      questionId: q.id,
      questionCode: q.questionCode,
      questionText: q.questionText,
      category: q.category,
      region: (q as { region?: string }).region,
      searchIntent: q.searchIntent,
      aiService: 'GEMINI',
      model: MODEL,
      mentionStatus: detection.status as 'MENTIONED' | 'NOT_MENTIONED' | 'FAILED',
      answerFull: answerText,
      answerSummary: answerText.length > 200 ? answerText.slice(0, 200) + '…' : answerText,
      sourceUrls,
      evidence: detection.evidence,
      failureReason: detection.failureReason,
      measuredAt,
      responseTimeMs,
      retryCount,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startMs;
    const raw = error instanceof Error ? error.message : String(error);
    return {
      questionId: q.id,
      questionCode: q.questionCode,
      questionText: q.questionText,
      category: q.category,
      region: (q as { region?: string }).region,
      searchIntent: q.searchIntent,
      aiService: 'GEMINI',
      model: MODEL,
      mentionStatus: 'FAILED',
      answerFull: '',
      answerSummary: '',
      sourceUrls: [],
      failureReason: `API 호출 실패: ${sanitizeError(raw)}`,
      measuredAt,
      responseTimeMs,
      retryCount: MAX_RETRIES,
    };
  }
}

// ── 파일 저장 ─────────────────────────────────────────────────────────────
function saveJSON(filePath: string, data: unknown): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  저장: ${filePath}`);
}

// ── 보고서 생성 ───────────────────────────────────────────────────────────
function buildReport(meta: RunMeta, results: RawResult[]): string {
  const lines: string[] = [];

  lines.push(`# GBRICK Coffee AI 검색 노출 측정 보고서`);
  lines.push(``);
  lines.push(`- **측정 ID**: ${meta.measurementRunId}`);
  lines.push(`- **측정 일시**: ${meta.startedAt} ~ ${meta.finishedAt}`);
  lines.push(`- **모델**: ${meta.model}`);
  lines.push(`- **DB 저장**: ${meta.dbSaved ? '완료' : '미연결 — 파일 저장'} (${meta.dbSaveNote})`);
  lines.push(``);
  lines.push(`## 요약`);
  lines.push(``);
  lines.push(`| 항목 | 값 |`);
  lines.push(`|---|---|`);
  lines.push(`| 전체 문항 수 | ${meta.totalQuestions} |`);
  lines.push(`| 정상 완료 | ${meta.completed} |`);
  lines.push(`| 실패 | ${meta.failed} |`);
  lines.push(`| 언급 (MENTIONED) | ${meta.mentioned} |`);
  lines.push(`| 미언급 (NOT_MENTIONED) | ${meta.notMentioned} |`);
  lines.push(`| **전체 언급률** | **${meta.mentionRate !== null ? meta.mentionRate + '%' : 'null (실패로 계산 불가)'}** |`);
  lines.push(`| 일반검색 언급률 | ${meta.generalMentionRate !== null ? meta.generalMentionRate + '%' : 'null'} |`);
  lines.push(`| 브랜드직접 언급률 | ${meta.brandMentionRate !== null ? meta.brandMentionRate + '%' : 'null'} |`);
  lines.push(``);
  lines.push(`## 질문별 결과`);
  lines.push(``);

  for (const r of results) {
    const icon = r.mentionStatus === 'MENTIONED' ? '✅' :
                 r.mentionStatus === 'NOT_MENTIONED' ? '❌' :
                 r.mentionStatus === 'FAILED' ? '⚠️' : '—';
    lines.push(`### ${r.questionCode} ${icon} ${r.mentionStatus}`);
    lines.push(``);
    lines.push(`**질문**: ${r.questionText}`);
    lines.push(``);
    lines.push(`- 카테고리: ${r.category} / ${r.searchIntent}`);
    lines.push(`- 응답 시간: ${r.responseTimeMs}ms${r.retryCount > 0 ? ` (재시도 ${r.retryCount}회)` : ''}`);
    lines.push(`- 측정일시: ${r.measuredAt}`);

    if (r.evidence) {
      lines.push(``);
      lines.push(`**언급 근거**: "${r.evidence}"`);
    }

    if (r.failureReason) {
      lines.push(``);
      lines.push(`**실패 사유**: ${r.failureReason}`);
    }

    if (r.answerSummary) {
      lines.push(``);
      lines.push(`**응답 요약** (200자):`);
      lines.push(`> ${r.answerSummary.replace(/\n/g, ' ')}`);
    }

    if (r.sourceUrls.length > 0) {
      lines.push(``);
      lines.push(`**출처 URL**:`);
      for (const url of r.sourceUrls.slice(0, 5)) {
        lines.push(`- ${url}`);
      }
      if (r.sourceUrls.length > 5) lines.push(`- ... 외 ${r.sourceUrls.length - 5}개`);
    }

    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`*이 보고서는 ${meta.startedAt} 기준 실측 결과입니다.*`);
  lines.push(`*판정 기준: "GBRICK Coffee" 또는 "지브릭커피" 명시적 언급 여부*`);

  return lines.join('\n');
}

// ── 메인 실행 ─────────────────────────────────────────────────────────────
async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY가 설정되지 않았습니다.');
    process.exit(1);
  }

  const activeQuestions = QUESTIONS.filter((q) => q.isActive);
  console.log(`\n═══ GBRICK Coffee AI 검색 실측 ═══`);
  console.log(`모델: ${MODEL}`);
  console.log(`질문 수: ${activeQuestions.length}개`);
  console.log(`DB: 미연결 (파일 저장으로 진행)`);
  console.log(`출력 디렉토리: ${OUTPUT_DIR}`);
  console.log(``);

  // ── STEP 1: Q01 파일럿 테스트 ─────────────────────────────────────────
  console.log(`[STEP 1] Q01 파일럿 테스트 실행 중...`);
  const pilotQ = activeQuestions.find((q) => q.questionCode === 'Q01')!;
  const pilotStart = Date.now();
  const pilotResult = await measureOne(pilotQ, apiKey);
  const pilotElapsed = Date.now() - pilotStart;

  console.log(`  Q01 결과: ${pilotResult.mentionStatus}`);
  console.log(`  응답 시간: ${pilotElapsed}ms`);
  if (pilotResult.mentionStatus === 'FAILED') {
    console.error(`  ⚠️ 실패 사유: ${pilotResult.failureReason}`);
    console.error(`  파일럿 실패 — 전체 실행 중단. 원인을 확인하세요.`);
    process.exit(1);
  }
  console.log(`  ✅ 파일럿 성공 — 전체 20문항 실행 시작`);
  console.log(``);

  // ── STEP 2: 전체 20문항 실행 ─────────────────────────────────────────
  const runId = `run_${Date.now()}_gbrick`;
  const startedAt = new Date().toISOString();
  const results: RawResult[] = [pilotResult]; // Q01은 이미 완료

  for (let i = 0; i < activeQuestions.length; i++) {
    const q = activeQuestions[i];
    if (q.questionCode === 'Q01') continue; // 이미 완료

    process.stdout.write(`  [${String(i + 1).padStart(2, '0')}/20] ${q.questionCode} "${q.questionText.slice(0, 30)}..." `);
    const r = await measureOne(q, apiKey);
    const icon = r.mentionStatus === 'MENTIONED' ? '✅' :
                 r.mentionStatus === 'NOT_MENTIONED' ? '❌' :
                 '⚠️';
    console.log(`${icon} ${r.mentionStatus} (${r.responseTimeMs}ms${r.retryCount > 0 ? ` retry:${r.retryCount}` : ''})`);
    results.push(r);

    if (i < activeQuestions.length - 1) {
      await new Promise((r) => setTimeout(r, INTER_QUESTION_DELAY_MS));
    }
  }

  const finishedAt = new Date().toISOString();

  // 결과를 questionCode 순서로 정렬
  results.sort((a, b) => a.questionCode.localeCompare(b.questionCode));

  // ── STEP 3: 통계 계산 ─────────────────────────────────────────────────
  const completed = results.filter((r) => r.mentionStatus !== 'FAILED').length;
  const failed = results.filter((r) => r.mentionStatus === 'FAILED').length;
  const mentioned = results.filter((r) => r.mentionStatus === 'MENTIONED').length;
  const notMentioned = results.filter((r) => r.mentionStatus === 'NOT_MENTIONED').length;

  const mentionRate = completed > 0 ? Math.round((mentioned / completed) * 1000) / 10 : null;

  const generalResults = results.filter((r) => {
    const q = activeQuestions.find((q) => q.questionCode === r.questionCode);
    return q && q.category !== 'BRAND';
  });
  const generalCompleted = generalResults.filter((r) => r.mentionStatus !== 'FAILED').length;
  const generalMentioned = generalResults.filter((r) => r.mentionStatus === 'MENTIONED').length;
  const generalMentionRate = generalCompleted > 0 ? Math.round((generalMentioned / generalCompleted) * 1000) / 10 : null;

  const brandResults = results.filter((r) => {
    const q = activeQuestions.find((q) => q.questionCode === r.questionCode);
    return q && q.category === 'BRAND';
  });
  const brandCompleted = brandResults.filter((r) => r.mentionStatus !== 'FAILED').length;
  const brandMentioned = brandResults.filter((r) => r.mentionStatus === 'MENTIONED').length;
  const brandMentionRate = brandCompleted > 0 ? Math.round((brandMentioned / brandCompleted) * 1000) / 10 : null;

  const meta: RunMeta = {
    measurementRunId: runId,
    businessId: 'gbrick-coffee',
    businessName: 'GBRICK Coffee',
    startedAt,
    finishedAt,
    model: MODEL,
    questionSetVersion: 'v1.1 (2026-10-23)',
    totalQuestions: activeQuestions.length,
    completed,
    failed,
    mentioned,
    notMentioned,
    mentionRate,
    generalMentionRate,
    brandMentionRate,
    dbSaved: false,
    dbSaveNote: 'DATABASE_URL 미설정 — 파일 저장 완료',
    outputDir: OUTPUT_DIR,
  };

  // ── STEP 4: 파일 저장 ─────────────────────────────────────────────────
  console.log(`\n[STEP 4] 결과 파일 저장 중...`);
  mkdirSync(REPORTS_DIR, { recursive: true });

  // raw-results: 원본 응답 전문 포함
  saveJSON(join(OUTPUT_DIR, `raw-results-${runId}.json`), {
    meta,
    results,
  });

  // normalized-results: 분석용 정규화 (answerFull 제외)
  saveJSON(join(OUTPUT_DIR, `normalized-results-${runId}.json`), {
    meta,
    results: results.map(({ answerFull: _full, ...rest }) => rest),
  });

  // measurement-summary: 집계 결과만
  saveJSON(join(OUTPUT_DIR, `measurement-summary-${runId}.json`), meta);

  // evidence-index: 질문별 증거 및 출처 목록
  saveJSON(join(OUTPUT_DIR, `evidence-index-${runId}.json`), {
    measurementRunId: runId,
    measuredAt: startedAt,
    model: MODEL,
    items: results.map((r) => ({
      questionCode: r.questionCode,
      questionText: r.questionText,
      mentionStatus: r.mentionStatus,
      evidence: r.evidence ?? null,
      sourceUrls: r.sourceUrls,
      sourceCount: r.sourceUrls.length,
    })),
  });

  // 보고서
  const reportPath = join(REPORTS_DIR, `gbrick-baseline-${runId}.md`);
  writeFileSync(reportPath, buildReport(meta, results), 'utf-8');
  console.log(`  저장: ${reportPath}`);

  // ── STEP 5: 최종 요약 출력 ───────────────────────────────────────────
  console.log(`\n═══ 측정 완료 ═══`);
  console.log(`측정 ID: ${runId}`);
  console.log(`시간: ${startedAt} ~ ${finishedAt}`);
  console.log(`결과: ${mentioned}건 언급 / ${notMentioned}건 미언급 / ${failed}건 실패`);
  console.log(`언급률: ${mentionRate !== null ? mentionRate + '%' : 'null'} (전체)`);
  console.log(`       ${generalMentionRate !== null ? generalMentionRate + '%' : 'null'} (일반검색)`);
  console.log(`       ${brandMentionRate !== null ? brandMentionRate + '%' : 'null'} (브랜드직접)`);
  console.log(`DB 저장: ${meta.dbSaved ? '완료' : '미연결 — 파일 저장 완료'}`);

  // 언급된 질문 목록
  const mentionedList = results.filter((r) => r.mentionStatus === 'MENTIONED');
  if (mentionedList.length > 0) {
    console.log(`\n언급된 질문:`);
    for (const r of mentionedList) {
      console.log(`  ✅ ${r.questionCode}: ${r.evidence?.slice(0, 60)}...`);
    }
  }

  // 실패 목록
  const failedList = results.filter((r) => r.mentionStatus === 'FAILED');
  if (failedList.length > 0) {
    console.log(`\n실패 질문:`);
    for (const r of failedList) {
      console.log(`  ⚠️  ${r.questionCode}: ${r.failureReason}`);
    }
  }
}

main().catch((err) => {
  console.error('실행 오류:', err);
  process.exit(1);
});
