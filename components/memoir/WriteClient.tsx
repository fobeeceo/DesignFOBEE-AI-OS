"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, Lightbulb, List, Sparkles, X } from "lucide-react";
import {
  CHAPTERS,
  PARTS,
  QUESTIONS,
  QUESTIONS_BY_CHAPTER,
  getChapter,
} from "@/lib/memoir/questions";
import { CHARS_PER_QUESTION, countChars, progressOf, toPages } from "@/lib/memoir/manuscript";
import { useMemoirBook } from "@/lib/memoir/storage";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { VoiceInput } from "@/components/memoir/VoiceInput";
import { ApiKeyPanel } from "@/components/memoir/ApiKeyPanel";

/**
 * AI 오류를 원인별로 알려준다.
 *
 * ⚠️ 예전에는 무슨 일이 나든 "잠시 뒤 다시 눌러 주세요"만 띄웠다. 그런데 서버에
 *    GEMINI_API_KEY가 없으면 백 번 눌러도 되지 않는다 — 기다리라는 안내가 거짓이 된다
 *    (§0-2 원칙 3). 서버는 이미 원인 코드를 보내고 있었으므로 그대로 살려 쓴다.
 */
const AI_ERROR_MESSAGE: Record<string, string> = {
  NO_API_KEY:
    "AI 키가 서버에 설정되어 있지 않습니다. 다시 눌러도 되지 않으니 관리자에게 알려 주세요. 질문에 답하고 원고를 모으는 기능은 그대로 쓰실 수 있습니다.",
  AI_FAILED: "AI에 연결하지 못했습니다. 잠시 뒤 다시 눌러 주세요.",
  NO_RESULT: "AI가 빈 답을 보냈습니다. 다시 한 번 눌러 주세요.",
  RATE_LIMITED:
    "오늘 쓸 수 있는 무료 횟수를 다 쓰셨습니다. 내일 다시 되고, 그 전에 쓰시려면 아래에서 내 API 키를 넣으시면 됩니다.",
  invalid_request: "답변이 너무 짧거나 너무 깁니다. 조금 고쳐서 다시 눌러 주세요.",
  server_error: "서버에서 오류가 났습니다. 잠시 뒤 다시 눌러 주세요.",
};

function aiErrorMessage(code: unknown, fallback: string): string {
  return (typeof code === "string" && AI_ERROR_MESSAGE[code]) || fallback;
}

/** 답변 칸에 붙이는 안내. 분량 감각이 있어야 사람들이 두세 문장에서 멈추지 않는다. */
function lengthHint(chars: number): string {
  if (chars === 0) return `말로 하면 3~4분 정도, 약 ${CHARS_PER_QUESTION.toLocaleString()}자면 넉넉합니다.`;
  if (chars < CHARS_PER_QUESTION / 3) return "좋습니다. 조금만 더 자세히 말씀해 주세요.";
  if (chars < CHARS_PER_QUESTION) return `${chars.toLocaleString()}자 — 약 ${toPages(chars)}쪽 분량입니다.`;
  return `${chars.toLocaleString()}자 — 약 ${toPages(chars)}쪽. 충분합니다.`;
}

export function WriteClient() {
  const { book, ready, saveState, setAnswer } = useMemoirBook();
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [showList, setShowList] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [aiState, setAiState] = useState<"idle" | "followup" | "polish">("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [polished, setPolished] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  // 개인 키는 원고와 함께 두지 않고 따로 보관한다 — 원고를 내보낼 때 키가 딸려 나가면 안 된다.
  const [byokKey, setByokKey] = useLocalStorage("fobee:memoir:apikey", "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const question = QUESTIONS[index];
  const chapter = getChapter(question.chapterId);
  const part = PARTS.find((p) => p.id === chapter?.partId);
  const progress = useMemo(() => progressOf(book), [book]);

  // 저장된 원고를 불러온 뒤, 아직 답하지 않은 첫 질문으로 이동한다.
  const jumped = useRef(false);
  useEffect(() => {
    if (!ready || jumped.current) return;
    jumped.current = true;
    const first = QUESTIONS.findIndex((q) => countChars(book.answers[q.id]?.text ?? "") === 0);
    if (first > 0) setIndex(first);
  }, [ready, book.answers]);

  // 질문이 바뀌면 저장된 답을 칸에 채운다.
  useEffect(() => {
    setDraft(book.answers[question.id]?.text ?? "");
    setFollowups([]);
    setPolished(null);
    setAiError(null);
    setShowHints(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, ready]);

  const write = useCallback(
    (text: string, fromVoice?: boolean) => {
      setDraft(text);
      setAnswer(question.id, text, fromVoice);
    },
    [question.id, setAnswer]
  );

  const appendVoice = useCallback(
    (text: string) => {
      if (!text) return;
      setDraft((prev) => {
        // 문장마다 줄을 바꾼다. 한 덩어리로 붙여놓으면 잘못 받아쓴 곳을
        // 휴대폰에서 찾아 고치기가 어렵다(실기기 확인 2026-08-21).
        const next = prev.trim() ? `${prev.trim()}\n${text}` : text;
        setAnswer(question.id, next, true);
        return next;
      });
    },
    [question.id, setAnswer]
  );

  function go(next: number) {
    setIndex(Math.max(0, Math.min(QUESTIONS.length - 1, next)));
    window.scrollTo({ top: 0 });
  }

  async function askFollowup() {
    if (countChars(draft) < 10) return;
    setAiState("followup");
    setAiError(null);
    try {
      const res = await fetch("/api/memoir/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.text,
          answer: draft,
          byokKey: byokKey.trim() || null,
        }),
      });
      const data = await res.json();
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      if (data.ok) setFollowups(data.questions);
      else setAiError(aiErrorMessage(data.error, "지금은 꼬리질문을 만들지 못했습니다. 잠시 뒤 다시 눌러 주세요."));
    } catch {
      setAiError("연결이 끊겼습니다. 인터넷 상태를 확인해 주세요.");
    } finally {
      setAiState("idle");
    }
  }

  async function askPolish() {
    if (countChars(draft) < 20) return;
    setAiState("polish");
    setAiError(null);
    try {
      const res = await fetch("/api/memoir/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft, byokKey: byokKey.trim() || null }),
      });
      const data = await res.json();
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      if (data.ok) setPolished(data.polished);
      else setAiError(aiErrorMessage(data.error, "지금은 다듬지 못했습니다. 잠시 뒤 다시 눌러 주세요."));
    } catch {
      setAiError("연결이 끊겼습니다. 인터넷 상태를 확인해 주세요.");
    } finally {
      setAiState("idle");
    }
  }

  const chars = countChars(draft);

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* 진행 상황 — 항상 보인다. 어디까지 왔는지가 계속 쓰게 만드는 유일한 장치다. */}
      <div className="sticky top-16 z-30 -mx-5 mb-6 border-b border-[#E5DFD4] bg-[#F6F4F0]/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center justify-between text-[13px] text-[#6B6255]">
          <span>
            질문 {index + 1} / {QUESTIONS.length} · 답변 {progress.answered}개
          </span>
          <span>
            {saveState === "saving" && "저장 중…"}
            {saveState === "saved" && "저장됨"}
            {saveState === "error" && (
              <span className="font-semibold text-[#8C4A32]">저장 실패 — 내보내기를 해두세요</span>
            )}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-[#E5DFD4]">
          <div
            className="h-1.5 rounded-full bg-[#8C4A32] transition-all"
            style={{ width: `${Math.max(1, (progress.answered / QUESTIONS.length) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-[13px] text-[#6B6255]">
          지금까지 {progress.chars.toLocaleString()}자 · 약 {progress.pages}쪽 (목표 {progress.targetPages}쪽)
        </p>
      </div>

      {/* 장 표시 */}
      <p className="text-[13px] font-semibold tracking-widest text-[#A8998A]">
        {part?.label} · {chapter?.title}
      </p>

      {/* 질문 */}
      <h1 className="mt-3 text-[22px] font-bold leading-[1.45] text-[#1B1815] sm:text-[26px]">
        {question.text}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#6B6255]">{question.why}</p>

      <button
        type="button"
        onClick={() => setShowHints((v) => !v)}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D5CFC3] px-4 py-2 text-[15px] text-[#5C5346]"
      >
        <Lightbulb className="h-4 w-4" />
        {showHints ? "도움말 접기" : "무엇을 말할지 모르겠다면"}
      </button>

      {showHints && (
        <ul className="mt-3 space-y-2 rounded-2xl bg-[#F1EDE6] px-5 py-4">
          {question.hints.map((hint) => (
            <li key={hint} className="text-[15px] leading-relaxed text-[#5C5346]">
              · {hint}
            </li>
          ))}
        </ul>
      )}

      {/* 답변 */}
      <div className="mt-6 space-y-3">
        <VoiceInput onTranscript={appendVoice} />

        <p className="text-[14px] leading-relaxed text-[#6B6255]">
          말로 답하시면 받아쓰기가 되지만, 지명·사람 이름은 틀리게 적힐 수 있습니다.
          다 말씀하신 뒤 아래 글을 눈으로 한 번 고쳐 주세요.
        </p>

        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => write(e.target.value)}
          placeholder="여기에 적거나, 위의 '말로 답하기'를 눌러 말씀하세요."
          className="min-h-[240px] w-full rounded-2xl border border-[#D5CFC3] bg-white p-4 text-[17px] leading-[1.8] text-[#1B1815] outline-none focus:border-[#8C4A32]"
        />

        <p className="text-[14px] text-[#6B6255]">{lengthHint(chars)}</p>
      </div>

      {/* AI 도움 */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={askFollowup}
          disabled={chars < 10 || aiState !== "idle"}
          className="inline-flex items-center gap-2 rounded-full border border-[#D5CFC3] px-4 py-2.5 text-[15px] text-[#5C5346] disabled:opacity-40"
        >
          <Sparkles className="h-4 w-4" />
          {aiState === "followup" ? "생각 중…" : "더 물어봐 주세요"}
        </button>
        <button
          type="button"
          onClick={askPolish}
          disabled={chars < 20 || aiState !== "idle"}
          className="inline-flex items-center gap-2 rounded-full border border-[#D5CFC3] px-4 py-2.5 text-[15px] text-[#5C5346] disabled:opacity-40"
        >
          <BookOpen className="h-4 w-4" />
          {aiState === "polish" ? "다듬는 중…" : "글로 다듬기"}
        </button>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[#A8998A]">
        이 두 버튼을 누를 때만 답변 내용이 AI에 전달됩니다. 그 외에는 이 휴대폰 안에만 저장됩니다.
      </p>

      <ApiKeyPanel
        value={byokKey}
        onChange={setByokKey}
        remaining={remaining}
        forceOpen={aiError !== null}
      />

      {aiError && (
        <p className="mt-3 rounded-xl bg-[#FBEDE9] px-4 py-3 text-[15px] text-[#8C4A32]">{aiError}</p>
      )}

      {followups.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[#E5DFD4] bg-white px-5 py-4">
          <p className="text-[14px] font-semibold text-[#8C4A32]">이어서 이것도 말씀해 주세요</p>
          <ul className="mt-3 space-y-3">
            {followups.map((q) => (
              <li key={q} className="text-[16px] leading-relaxed text-[#1B1815]">
                {q}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-[#A8998A]">
            위 답변 칸에 이어서 적으시면 됩니다.
          </p>
        </div>
      )}

      {polished !== null && (
        <div className="mt-4 rounded-2xl border border-[#E5DFD4] bg-white px-5 py-4">
          <p className="text-[14px] font-semibold text-[#8C4A32]">다듬은 글</p>
          <p className="mt-3 whitespace-pre-wrap text-[16px] leading-[1.8] text-[#1B1815]">
            {polished}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                write(polished);
                setPolished(null);
              }}
              className="rounded-full bg-[#8C4A32] px-5 py-2.5 text-[15px] font-semibold text-white"
            >
              이걸로 바꾸기
            </button>
            <button
              type="button"
              onClick={() => setPolished(null)}
              className="rounded-full border border-[#D5CFC3] px-5 py-2.5 text-[15px] text-[#5C5346]"
            >
              원래 글 그대로 두기
            </button>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-[#A8998A]">
            AI는 문장만 정리합니다. 없는 사실을 만들어 넣지 않습니다. 그래도 바꾸기 전에 한 번 읽어봐 주세요.
          </p>
        </div>
      )}

      {/* 이동 */}
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="flex h-14 flex-1 items-center justify-center gap-1 rounded-2xl border border-[#D5CFC3] text-[16px] font-semibold text-[#5C5346] disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" /> 이전
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === QUESTIONS.length - 1}
          className="flex h-14 flex-[2] items-center justify-center gap-1 rounded-2xl bg-[#1B1815] text-[16px] font-semibold text-white disabled:opacity-40"
        >
          다음 질문 <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowList(true)}
          className="inline-flex items-center gap-2 text-[15px] text-[#5C5346] underline underline-offset-4"
        >
          <List className="h-4 w-4" /> 질문 전체 보기
        </button>
        <Link href="/memoir/book" className="text-[15px] text-[#8C4A32] underline underline-offset-4">
          내 원고 보기 · 내보내기
        </Link>
      </div>

      {/* 질문 목록 */}
      {showList && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F6F4F0]">
          <div className="sticky top-0 flex h-16 items-center justify-between border-b border-[#E5DFD4] bg-[#F6F4F0] px-5">
            <span className="text-[17px] font-bold text-[#1B1815]">질문 전체</span>
            <button type="button" aria-label="닫기" onClick={() => setShowList(false)}>
              <X className="h-6 w-6 text-[#5C5346]" />
            </button>
          </div>

          <div className="mx-auto max-w-2xl px-5 pb-16 pt-6">
            {CHAPTERS.map((c) => (
              <section key={c.id} className="mb-8">
                <h2 className="text-[17px] font-bold text-[#1B1815]">{c.title}</h2>
                <p className="mt-1 text-[14px] text-[#6B6255]">{c.subtitle}</p>
                <ul className="mt-3 space-y-1">
                  {QUESTIONS_BY_CHAPTER[c.id].map((q) => {
                    const done = countChars(book.answers[q.id]?.text ?? "") > 0;
                    return (
                      <li key={q.id}>
                        <button
                          type="button"
                          onClick={() => {
                            go(QUESTIONS.findIndex((x) => x.id === q.id));
                            setShowList(false);
                          }}
                          className="w-full rounded-xl px-3 py-3 text-left text-[16px] leading-snug hover:bg-[#EFEBE3]"
                        >
                          <span className={done ? "text-[#8C4A32]" : "text-[#5C5346]"}>
                            {done ? "✓ " : "· "}
                            {q.text}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
