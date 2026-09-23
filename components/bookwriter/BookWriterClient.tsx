"use client";

import { useRef, useState } from "react";
import { ClipboardCopy, Download, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import {
  FIELD_LIMIT,
  buildPrompt,
  outlineText,
  parseOutline,
  tail,
  type PromptInput,
} from "@/lib/bookwriter/prompts";
import {
  countChars,
  manuscriptChars,
  normalizeProject,
  toMarkdown,
  type BookChapter,
  type BookProject,
} from "@/lib/bookwriter/project";
import { downloadText, useBookProject } from "@/lib/bookwriter/storage";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { ApiKeyPanel } from "@/components/memoir/ApiKeyPanel";

/** 서버가 보내는 원인 코드별 안내 — 자서전 코너와 같은 원칙: 기다려도 안 되는 일을 기다리라고 하지 않는다. */
const AI_ERROR_MESSAGE: Record<string, string> = {
  NO_API_KEY: "AI 키가 서버에 설정되어 있지 않습니다. 「Claude용 프롬프트 복사」로 Claude에서 직접 쓰시거나, 아래에서 내 API 키를 넣어 주세요.",
  AI_FAILED: "AI에 연결하지 못했습니다. 잠시 뒤 다시 눌러 주세요.",
  NO_RESULT: "AI가 빈 답을 보냈습니다. 다시 한 번 눌러 주세요.",
  RATE_LIMITED: "오늘 무료 횟수를 다 쓰셨습니다. 아래에서 내 API 키를 넣거나, 「Claude용 프롬프트 복사」를 쓰세요.",
  invalid_request: "입력한 글이 너무 깁니다. 조금 줄여서 다시 눌러 주세요.",
  server_error: "서버에서 오류가 났습니다. 잠시 뒤 다시 눌러 주세요.",
};

type Mode = "fractal" | "discovery";

const input =
  "w-full rounded-xl border border-[#D5CFC3] bg-white px-4 py-3 text-[16px] leading-relaxed text-[#1B1815] outline-none focus:border-[#8C4A32]";
const label = "block text-[14px] font-semibold text-[#6B6255]";

function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export function BookWriterClient() {
  const { project: p, ready, saveState, update } = useBookProject();
  const [mode, setMode] = useState<Mode>("fractal");
  const [chapterIdx, setChapterIdx] = useState(0);
  const [beat, setBeat] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [byokKey, setByokKey] = useLocalStorage("fobee:memoir:apikey", "");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<BookProject>) => update((prev) => ({ ...prev, ...patch }));
  const setChapter = (i: number, patch: Partial<BookChapter>) =>
    update((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c, j) => (j === i ? { ...c, ...patch } : c)),
    }));

  const chapter = p.chapters[chapterIdx];
  const basics = { kind: p.kind, genre: p.genre, premise: p.premise, pov: p.pov, tense: p.tense };

  /** 각 단계의 프롬프트 재료. 화면의 복사 버튼과 서버 호출이 같은 값을 쓴다. */
  function inputFor(step: PromptInput["step"]): PromptInput {
    const common = { ...basics, step, bible: p.bible, sources: p.sources, styleSample: p.styleSample };
    switch (step) {
      case "ideas":
        return { ...basics, step };
      case "bible":
        return { ...basics, step, idea: p.idea };
      case "outline":
        return { ...common, chapterCount: p.chapterCount };
      case "beats":
        return {
          ...common,
          outline: outlineText(p.chapters),
          chapterTitle: chapter?.title,
          chapterSummary: chapter?.summary,
        };
      case "draft":
        return {
          ...common,
          chapterTitle: chapter?.title,
          chapterSummary: chapter?.summary,
          beats: chapter?.beats,
          previous: tail(p.chapters[chapterIdx - 1]?.draft ?? ""),
        };
      case "scene":
        return { ...common, previous: tail(p.discovery), beat };
    }
  }

  async function run(step: PromptInput["step"]): Promise<string | null> {
    setBusy(step);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/bookwriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inputFor(step), byokKey: byokKey.trim() || null }),
      });
      const data = await res.json();
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      if (data.ok) return data.text as string;
      setError(AI_ERROR_MESSAGE[data.error] ?? "지금은 만들지 못했습니다. 잠시 뒤 다시 눌러 주세요.");
    } catch {
      setError("연결이 끊겼습니다. 인터넷 상태를 확인해 주세요.");
    } finally {
      setBusy(null);
    }
    return null;
  }

  async function copyPrompt(step: PromptInput["step"]) {
    setError(null);
    try {
      await navigator.clipboard.writeText(buildPrompt(inputFor(step)));
      setNotice("프롬프트를 복사했습니다. Claude(프로젝트 기능 권장)에 붙여넣고, 결과를 이 칸에 옮겨 주세요.");
    } catch {
      setError("복사하지 못했습니다. 브라우저가 클립보드를 막고 있습니다.");
    }
  }

  /** 작가가 고친 글을 AI 결과로 덮어쓰기 전에 한 번 묻는다. */
  function okToReplace(current: string): boolean {
    return !current.trim() || window.confirm("지금 칸의 글을 AI 결과로 바꿉니다. 계속할까요?");
  }

  async function genInto(step: PromptInput["step"], current: string, apply: (text: string) => void) {
    if (!okToReplace(current)) return;
    const text = await run(step);
    if (text) apply(text);
  }

  async function genOutline() {
    if (p.chapters.length && !window.confirm("지금 목차와 장별 원고를 새 목차로 바꿉니다. 계속할까요?")) return;
    const text = await run("outline");
    if (!text) return;
    const chapters = parseOutline(text);
    if (!chapters.length) {
      setError("AI가 목차를 알아볼 수 없는 모양으로 보냈습니다. 다시 한 번 눌러 주세요.");
      return;
    }
    set({ chapters: chapters.map((c) => ({ ...c, beats: "", draft: "" })) });
    setChapterIdx(0);
  }

  async function genScene() {
    const text = await run("scene");
    if (!text) return;
    update((prev) => ({ ...prev, discovery: prev.discovery.trim() ? `${prev.discovery.trim()}\n\n${text}` : text }));
    setBeat("");
  }

  function restore(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = normalizeProject(JSON.parse(String(reader.result)));
        if (window.confirm("백업 파일로 지금 원고를 덮어씁니다. 계속할까요?")) {
          update(() => next);
          setChapterIdx(0);
        }
      } catch {
        setError("백업 파일을 읽지 못했습니다. 이 도구에서 내려받은 .json 파일인지 확인해 주세요.");
      }
    };
    reader.readAsText(file);
  }

  /** 단계마다 붙는 두 버튼: 서버 AI로 바로 쓰기 / Claude에 붙여넣을 프롬프트 복사. */
  function Actions({ step, onGen, disabled, text = "AI로 만들기" }: {
    step: PromptInput["step"];
    onGen: () => void;
    disabled?: boolean;
    text?: string;
  }) {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onGen}
          disabled={disabled || busy !== null}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#8C4A32] px-5 text-[15px] font-semibold text-white disabled:opacity-40"
        >
          <Sparkles className="h-4 w-4" />
          {busy === step ? "쓰는 중…" : text}
        </button>
        <button
          type="button"
          onClick={() => copyPrompt(step)}
          disabled={disabled}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-[#D5CFC3] px-5 text-[15px] font-semibold text-[#5C5346] disabled:opacity-40"
        >
          <ClipboardCopy className="h-4 w-4" />
          Claude용 프롬프트 복사
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-[13px] font-semibold tracking-[0.2em] text-[#A8998A]">책 집필 도구</p>
      <h1 className="mt-3 text-[28px] font-bold leading-[1.35] sm:text-[36px]">AI와 함께 쓰는 책 한 권</h1>
      <p className="mt-4 text-[16px] leading-[1.8] text-[#5C5346]">
        버튼 하나로 책이 되지는 않습니다. 아이디어 → 기획서 → 목차 → 장면 → 초안 순서로 작게 나눠 쓰고, 단계마다
        작가가 직접 고칩니다. 다음 단계는 언제나 <strong className="text-[#1B1815]">고친 글</strong>을 기준으로 씁니다.
      </p>

      {/* 소개글은 서버 HTML에 그대로 두고, 저장된 원고를 읽기 전까지는 편집 칸을 열지 않는다(§0-6). */}
      {!ready ? (
        <p className="mt-8 text-[16px] text-[#6B6255]">원고를 불러오는 중…</p>
      ) : (
      <>
      {/* 제목·저장·백업 */}
      <section className="mt-8 rounded-3xl bg-white p-5 sm:p-7">
        <label className={label}>
          책 제목(가제)
          <input className={`${input} mt-1`} value={p.title} maxLength={FIELD_LIMIT.short} onChange={(e) => set({ title: e.target.value })} />
        </label>
        <p className="mt-3 text-[14px] text-[#A8998A]">
          {saveState === "error"
            ? "⚠️ 이 브라우저에 저장하지 못했습니다. 지금 백업 파일을 내려받아 주세요."
            : `이 브라우저에만 저장됩니다 · 원고 ${manuscriptChars(p).toLocaleString()}자`}
          {saveState === "saving" && " · 저장 중…"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[15px]">
          <button type="button" onClick={() => downloadText(`책-원고-${stamp()}.md`, toMarkdown(p), "text/markdown")} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#D5CFC3] px-4 font-semibold text-[#5C5346]">
            <Download className="h-4 w-4" /> 원고 내려받기(.md)
          </button>
          <button type="button" onClick={() => downloadText(`책-백업-${stamp()}.json`, JSON.stringify(p, null, 2), "application/json")} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#D5CFC3] px-4 font-semibold text-[#5C5346]">
            <Download className="h-4 w-4" /> 백업(.json)
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#D5CFC3] px-4 font-semibold text-[#5C5346]">
            <Upload className="h-4 w-4" /> 백업 불러오기
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) restore(f); e.target.value = ""; }} />
        </div>
        <ApiKeyPanel value={byokKey} onChange={setByokKey} remaining={remaining} forceOpen={error === AI_ERROR_MESSAGE.RATE_LIMITED} />
      </section>

      {/* 기본 정보 */}
      <section className="mt-6 rounded-3xl bg-white p-5 sm:p-7">
        <h2 className="text-[20px] font-bold">기본 정보</h2>
        <div className="mt-4 flex gap-2">
          {(["fiction", "nonfiction"] as const).map((k) => (
            <button key={k} type="button" onClick={() => set({ kind: k })} className={`h-11 flex-1 rounded-full text-[15px] font-semibold ${p.kind === k ? "bg-[#1B1815] text-white" : "border border-[#D5CFC3] text-[#5C5346]"}`}>
              {k === "fiction" ? "소설" : "비소설(자기계발·에세이·전문서)"}
            </button>
          ))}
        </div>
        <label className={`${label} mt-4`}>
          장르 / 분야
          <input className={`${input} mt-1`} value={p.genre} maxLength={FIELD_LIMIT.short} placeholder={p.kind === "fiction" ? "예: 판타지, 미스터리" : "예: 공간 브랜딩, 창업"} onChange={(e) => set({ genre: e.target.value })} />
        </label>
        {p.kind === "fiction" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={label}>
              시점
              <input className={`${input} mt-1`} value={p.pov} maxLength={FIELD_LIMIT.short} onChange={(e) => set({ pov: e.target.value })} />
            </label>
            <label className={label}>
              시제
              <input className={`${input} mt-1`} value={p.tense} maxLength={FIELD_LIMIT.short} onChange={(e) => set({ tense: e.target.value })} />
            </label>
          </div>
        )}
        <label className={`${label} mt-4`}>
          처음 생각(없어도 됩니다)
          <textarea className={`${input} mt-1 min-h-[88px]`} value={p.premise} maxLength={FIELD_LIMIT.medium} onChange={(e) => set({ premise: e.target.value })} />
        </label>
      </section>

      {/* 방식 선택 */}
      <div className="mt-6 flex gap-2">
        {([["fractal", "목차부터 (프랙탈)"], ["discovery", "한 장면씩 (즉흥 집필)"]] as const).map(([m, name]) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`h-12 flex-1 rounded-full text-[15px] font-semibold ${mode === m ? "bg-[#8C4A32] text-white" : "border border-[#D5CFC3] text-[#5C5346]"}`}>
            {name}
          </button>
        ))}
      </div>

      {(error || notice) && (
        <p role="status" className={`mt-4 rounded-2xl px-5 py-4 text-[15px] leading-relaxed ${error ? "bg-[#FBEDE8] text-[#8C4A32]" : "bg-[#EEF3EF] text-[#4E6B57]"}`}>
          {error ?? notice}
        </p>
      )}

      {mode === "fractal" ? (
        <>
          <Step n={1} title="아이디어 5가지">
            <Actions step="ideas" onGen={() => genInto("ideas", p.ideas, (t) => set({ ideas: t }))} />
            <textarea className={`${input} mt-3 min-h-[160px]`} value={p.ideas} maxLength={FIELD_LIMIT.long} onChange={(e) => set({ ideas: e.target.value })} />
            <label className={`${label} mt-4`}>
              고른 아이디어 — 위에서 옮겨 적고 마음대로 고치세요
              <textarea className={`${input} mt-1 min-h-[100px]`} value={p.idea} maxLength={FIELD_LIMIT.medium} onChange={(e) => set({ idea: e.target.value })} />
            </label>
          </Step>

          <Step n={2} title={p.kind === "fiction" ? "기획서 (스토리 바이블)" : "기획서"}>
            <p className="text-[15px] leading-relaxed text-[#6B6255]">
              {p.kind === "fiction" ? "인물 3명 · 배경 3가지 · 절정과 결말." : "핵심 메시지 · 독자 · 저자 경험 · 장 구성 원칙."} 이후 모든 단계의 기준 문서입니다. Claude 프로젝트에 이 글을 올려두면 매번 붙여넣지 않아도 됩니다.
            </p>
            <Actions step="bible" disabled={!p.idea.trim()} onGen={() => genInto("bible", p.bible, (t) => set({ bible: t }))} />
            <textarea className={`${input} mt-3 min-h-[220px]`} value={p.bible} maxLength={FIELD_LIMIT.long} onChange={(e) => set({ bible: e.target.value })} />
            {p.kind === "nonfiction" && (
              <label className={`${label} mt-4`}>
                근거 자료 — 수치·통계·연구·인용과 출처
                <span className="mt-1 block text-[14px] font-normal leading-relaxed text-[#A8998A]">
                  AI는 여기 있는 것만 인용합니다. 없으면 [확인 필요]로 비워둡니다. Perplexity 같은 검색형 AI로 모으고 출처를 꼭 함께 적으세요.
                </span>
                <textarea className={`${input} mt-1 min-h-[140px]`} value={p.sources} maxLength={FIELD_LIMIT.long} onChange={(e) => set({ sources: e.target.value })} />
              </label>
            )}
          </Step>

          <Step n={3} title="전체 목차">
            <label className={label}>
              장 수
              <input type="number" min={3} max={60} className={`${input} mt-1 w-28`} value={p.chapterCount} onChange={(e) => set({ chapterCount: Math.max(3, Math.min(60, Number(e.target.value) || 12)) })} />
            </label>
            <Actions step="outline" disabled={!p.bible.trim()} onGen={genOutline} />
            <ol className="mt-4 space-y-3">
              {p.chapters.map((c, i) => (
                <li key={i} className="rounded-2xl border border-[#E5DFD4] p-4">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-[14px] font-semibold text-[#A8998A]">{i + 1}장</span>
                    <input className={`${input} py-2`} value={c.title} maxLength={FIELD_LIMIT.short} onChange={(e) => setChapter(i, { title: e.target.value })} />
                    <button type="button" aria-label={`${i + 1}장 삭제`} onClick={() => { if (window.confirm(`${i + 1}장을 목차에서 뺍니다. 이 장의 원고도 함께 지워집니다.`)) { update((prev) => ({ ...prev, chapters: prev.chapters.filter((_, j) => j !== i) })); setChapterIdx(0); } }} className="p-2 text-[#A8998A]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea className={`${input} mt-2 min-h-[88px]`} value={c.summary} maxLength={FIELD_LIMIT.medium} onChange={(e) => setChapter(i, { summary: e.target.value })} />
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => update((prev) => ({ ...prev, chapters: [...prev.chapters, { title: "", summary: "", beats: "", draft: "" }] }))} className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#8C4A32]">
              <Plus className="h-4 w-4" /> 장 직접 추가
            </button>
          </Step>

          <Step n={4} title="장별 집필 — 장면 분해 → 초안">
            {p.chapters.length === 0 ? (
              <p className="text-[15px] text-[#6B6255]">3단계에서 목차를 먼저 만들어 주세요.</p>
            ) : (
              <>
                <select className={input} value={chapterIdx} onChange={(e) => setChapterIdx(Number(e.target.value))}>
                  {p.chapters.map((c, i) => (
                    <option key={i} value={i}>
                      {i + 1}장. {c.title || "(제목 없음)"} {c.draft.trim() ? `· ${countChars(c.draft).toLocaleString()}자` : ""}
                    </option>
                  ))}
                </select>
                {chapter && (
                  <>
                    <p className="mt-3 text-[15px] leading-relaxed text-[#6B6255]">{chapter.summary}</p>
                    <h3 className="mt-5 text-[16px] font-bold">① 장면 분해 (12~15단계)</h3>
                    <Actions step="beats" onGen={() => genInto("beats", chapter.beats, (t) => setChapter(chapterIdx, { beats: t }))} />
                    <textarea className={`${input} mt-3 min-h-[180px]`} value={chapter.beats} maxLength={FIELD_LIMIT.long} onChange={(e) => setChapter(chapterIdx, { beats: e.target.value })} />
                    <h3 className="mt-5 text-[16px] font-bold">② 초안</h3>
                    <p className="mt-1 text-[14px] text-[#A8998A]">
                      {p.styleSample.trim() ? "5단계 문체 견본을 따라 씁니다." : "5단계에 문체 견본을 넣으면 그 문체로 씁니다."}
                      {chapterIdx > 0 && " 앞 장 초안의 끝부분을 이어받습니다."}
                    </p>
                    <Actions step="draft" disabled={!chapter.beats.trim()} onGen={() => genInto("draft", chapter.draft, (t) => setChapter(chapterIdx, { draft: t }))} />
                    <textarea className={`${input} mt-3 min-h-[360px]`} value={chapter.draft} maxLength={FIELD_LIMIT.long * 3} onChange={(e) => setChapter(chapterIdx, { draft: e.target.value })} />
                  </>
                )}
              </>
            )}
          </Step>

          <Step n={5} title="문체 견본 (Human Touch)">
            <p className="text-[15px] leading-relaxed text-[#6B6255]">
              AI가 쓴 1장을 직접 대사·어조·묘사까지 고쳐 여기에 두세요. 이후 초안과 장면은 이 문체를 따라 씁니다.
            </p>
            {p.chapters[0]?.draft.trim() && (
              <button type="button" onClick={() => { if (okToReplace(p.styleSample)) set({ styleSample: p.chapters[0].draft.slice(0, FIELD_LIMIT.long) }); }} className="mt-3 text-[15px] font-semibold text-[#8C4A32] underline underline-offset-4">
                1장 초안을 가져와서 고치기
              </button>
            )}
            <textarea className={`${input} mt-3 min-h-[240px]`} value={p.styleSample} maxLength={FIELD_LIMIT.long} onChange={(e) => set({ styleSample: e.target.value })} />
          </Step>
        </>
      ) : (
        <Step n={1} title="즉흥 집필 — 한 장면씩 이어 쓰기">
          <p className="text-[15px] leading-relaxed text-[#6B6255]">
            목차 없이 다음 장면에서 일어날 일을 1~2문장으로 적으면 400~800자 장면을 이어 씁니다. 결과를 읽고 고친 뒤 다음 장면으로 넘어가세요.
          </p>
          <label className={`${label} mt-4`}>
            다음 장면
            <textarea className={`${input} mt-1 min-h-[88px]`} value={beat} maxLength={FIELD_LIMIT.medium} placeholder="예: 주인공이 경찰서에 들어와 의자에 앉는다. 커피머신이 고장 났다며 불평한다." onChange={(e) => setBeat(e.target.value)} />
          </label>
          <Actions step="scene" text="이어 쓰기" disabled={!beat.trim()} onGen={genScene} />
          <textarea className={`${input} mt-4 min-h-[420px]`} value={p.discovery} maxLength={FIELD_LIMIT.long * 5} onChange={(e) => set({ discovery: e.target.value })} />
        </Step>
      )}
      </>
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-5 sm:p-7">
      <h2 className="text-[20px] font-bold">
        <span className="mr-2 text-[#8C4A32]">{n}</span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
