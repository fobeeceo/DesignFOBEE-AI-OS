"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check, ClipboardCopy, Download, FileText, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import {
  DRAFT_CHUNK_CHARS,
  FIELD_LIMIT,
  buildPrompt,
  outlineText,
  parseOutline,
  tail,
  type PromptInput,
} from "@/lib/bookwriter/prompts";
import {
  chapterTarget,
  countChars,
  manuscriptChars,
  normalizeProject,
  targetChars,
  toMarkdown,
  toPages,
  type BookChapter,
  type BookProject,
} from "@/lib/bookwriter/project";
import { downloadText, useBookProject } from "@/lib/bookwriter/storage";
import { CHARS_PER_PAGE } from "@/lib/memoir/pageSize";
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
type Step = PromptInput["step"];

const input =
  "w-full rounded-xl border border-[#D5CFC3] bg-white px-4 py-3 text-[16px] leading-relaxed text-[#1B1815] outline-none focus:border-[#8C4A32]";
const label = "block text-[14px] font-semibold text-[#6B6255]";
const hint = "mt-1 block text-[14px] font-normal leading-relaxed text-[#A8998A]";
const ghostBtn =
  "inline-flex h-11 items-center gap-2 rounded-full border border-[#D5CFC3] px-4 text-[15px] font-semibold text-[#5C5346] disabled:opacity-40";

function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

/** 진행 체크리스트 — 각 단계가 끝났는지는 저장된 값에서 계산한다(§0-2 원칙 5). */
function checklist(p: BookProject) {
  const n = p.chapters.length;
  const drafted = p.chapters.filter((c) => c.draft.trim()).length;
  const reviewed = p.chapters.filter((c) => c.review.trim()).length;
  return [
    { id: "s-market", name: "시장 기획", done: !!p.positioning.trim() },
    { id: "s-ideas", name: "아이디어", done: !!p.idea.trim() },
    { id: "s-bible", name: "기획서", done: !!p.bible.trim() },
    { id: "s-title", name: "제목", done: !!p.title.trim() },
    { id: "s-outline", name: "목차", done: n > 0 },
    { id: "s-write", name: `초안 ${drafted}/${n || "-"}`, done: n > 0 && drafted === n },
    { id: "s-write", name: `검토 ${reviewed}/${n || "-"}`, done: n > 0 && reviewed === n },
    { id: "s-sales", name: "판매 문안", done: !!p.sales.trim() },
  ];
}

const pct = (n: number, of: number) => (of > 0 ? Math.min(100, Math.round((n / of) * 100)) : 0);

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
  const perChapter = chapterTarget(p);
  const total = manuscriptChars(p);

  /** 각 단계의 프롬프트 재료. 화면의 복사 버튼과 서버 호출이 같은 값을 쓴다. */
  function inputFor(step: Step): PromptInput {
    const basics = { kind: p.kind, genre: p.genre, premise: p.premise, pov: p.pov, tense: p.tense, step };
    const market = { reader: p.reader, problem: p.problem, comps: p.comps, positioning: p.positioning };
    const book = { title: p.title, subtitle: p.subtitle, targetPages: p.targetPages };
    const ch = { chapterTitle: chapter?.title, chapterSummary: chapter?.summary, chapterTarget: perChapter };
    switch (step) {
      case "market":
        return { ...basics, ...market, positioning: "", authorInfo: p.authorInfo };
      case "ideas":
        return { ...basics, ...market };
      case "bible":
        return { ...basics, ...market, idea: p.idea, authorInfo: p.authorInfo };
      case "titles":
        return { ...basics, ...market, bible: p.bible };
      case "outline":
        return { ...basics, ...market, ...book, bible: p.bible, sources: p.sources, chapterCount: p.chapterCount };
      case "beats":
        return { ...basics, ...book, ...ch, bible: p.bible, outline: outlineText(p.chapters) };
      case "draft":
        return {
          ...basics, ...market, ...book, ...ch,
          bible: p.bible, sources: p.sources, styleSample: p.styleSample, beats: chapter?.beats,
          previous: tail(p.chapters[chapterIdx - 1]?.draft ?? ""),
        };
      case "continue":
        return {
          ...basics, ...book, ...ch,
          bible: p.bible, sources: p.sources, styleSample: p.styleSample, beats: chapter?.beats, draft: chapter?.draft,
        };
      case "review":
        return { ...basics, ...market, ...book, ...ch, sources: p.sources, draft: chapter?.draft };
      case "sales":
        return { ...basics, ...market, ...book, bible: p.bible, outline: outlineText(p.chapters), authorInfo: p.authorInfo };
      case "scene":
        return { ...basics, bible: p.bible, sources: p.sources, styleSample: p.styleSample, previous: tail(p.discovery), beat };
    }
  }

  async function run(step: Step): Promise<string | null> {
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

  async function copyPrompt(step: Step) {
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

  async function genInto(step: Step, current: string, apply: (text: string) => void) {
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
    set({ chapters: chapters.map((c) => ({ ...c, beats: "", draft: "", review: "" })) });
    setChapterIdx(0);
  }

  /** 이어 쓰기 — 지금 원고 뒤에 붙인다. 덮어쓰지 않으므로 묻지 않는다. */
  async function genContinue() {
    const i = chapterIdx;
    const text = await run("continue");
    if (!text) return;
    update((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c, j) =>
        j === i ? { ...c, draft: c.draft.trim() ? `${c.draft.trim()}\n\n${text}` : text } : c
      ),
    }));
  }

  async function genScene() {
    const text = await run("scene");
    if (!text) return;
    update((prev) => ({ ...prev, discovery: prev.discovery.trim() ? `${prev.discovery.trim()}\n\n${text}` : text }));
    setBeat("");
  }

  async function exportDocx() {
    setError(null);
    try {
      const { buildBookDocx, docxFileName } = await import("@/lib/bookwriter/exportDocx");
      const blob = await buildBookDocx(p);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = docxFileName(p.title);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Word 파일을 만들지 못했습니다. 원고(.md) 내려받기를 대신 써 주세요.");
    }
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
  function actions(step: Step, onGen: () => void, disabled = false, text = "AI로 만들기", extra?: ReactNode) {
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
        {extra}
        <button type="button" onClick={() => copyPrompt(step)} disabled={disabled} className={ghostBtn}>
          <ClipboardCopy className="h-4 w-4" />
          Claude용 프롬프트 복사
        </button>
      </div>
    );
  }

  const area = (value: string, onChange: (v: string) => void, cls: string, max: number = FIELD_LIMIT.long, placeholder?: string) => (
    <textarea className={`${input} mt-1 ${cls}`} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-[13px] font-semibold tracking-[0.2em] text-[#A8998A]">책 집필 도구</p>
      <h1 className="mt-3 text-[28px] font-bold leading-[1.35] sm:text-[36px]">팔리는 책 한 권, 기획부터 투고 원고까지</h1>
      <p className="mt-4 text-[16px] leading-[1.8] text-[#5C5346]">
        팔리는 책은 문장보다 <strong className="text-[#1B1815]">“누가 왜 이 책을 사는가”</strong>에서 먼저 결정됩니다. 그래서 시장 기획 → 제목 →
        목차 → 초안 → 편집자 검토 → 판매 문안 순서로 씁니다. 단계마다 작가가 직접 고치고, 다음 단계는 언제나 고친 글을 기준으로 씁니다.
      </p>

      {/* 소개글은 서버 HTML에 그대로 두고, 저장된 원고를 읽기 전까지는 편집 칸을 열지 않는다(§0-6). */}
      {!ready ? (
        <p className="mt-8 text-[16px] text-[#6B6255]">원고를 불러오는 중…</p>
      ) : (
      <>
      {/* 진행 상황·분량·내보내기 */}
      <section className="mt-8 rounded-3xl bg-white p-5 sm:p-7">
        <p className="text-[16px] font-semibold text-[#1B1815]">
          {p.title.trim() || "제목 미정"}
          {p.subtitle.trim() && <span className="font-normal text-[#6B6255]"> — {p.subtitle.trim()}</span>}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EFEAE1]">
          <div className="h-full bg-[#8C4A32]" style={{ width: `${pct(total, targetChars(p))}%` }} />
        </div>
        <p className="mt-2 text-[14px] text-[#6B6255]">
          원고 {total.toLocaleString()}자 · 약 {toPages(total)}쪽 / 목표 약 {p.targetPages}쪽
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {checklist(p).map((s) => (
            <li key={s.name}>
              <a href={`#${s.id}`} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[14px] ${s.done ? "bg-[#EEF3EF] text-[#4E6B57]" : "bg-[#F6F4F0] text-[#6B6255]"}`}>
                {s.done && <Check className="h-3.5 w-3.5" />}
                {s.name}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[14px] text-[#A8998A]">
          {saveState === "error"
            ? "⚠️ 이 브라우저에 저장하지 못했습니다. 지금 백업 파일을 내려받아 주세요."
            : "원고는 이 브라우저에만 저장됩니다. 가끔 백업을 내려받아 두세요."}
          {saveState === "saving" && " · 저장 중…"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={exportDocx} className={ghostBtn}>
            <FileText className="h-4 w-4" /> 투고 원고(Word)
          </button>
          <button type="button" onClick={() => downloadText(`책-원고-${stamp()}.md`, toMarkdown(p), "text/markdown")} className={ghostBtn}>
            <Download className="h-4 w-4" /> 원고(.md)
          </button>
          <button type="button" onClick={() => downloadText(`책-백업-${stamp()}.json`, JSON.stringify(p, null, 2), "application/json")} className={ghostBtn}>
            <Download className="h-4 w-4" /> 백업(.json)
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={ghostBtn}>
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
          {(["nonfiction", "fiction"] as const).map((k) => (
            <button key={k} type="button" onClick={() => set({ kind: k })} className={`h-11 flex-1 rounded-full text-[15px] font-semibold ${p.kind === k ? "bg-[#1B1815] text-white" : "border border-[#D5CFC3] text-[#5C5346]"}`}>
              {k === "fiction" ? "소설" : "비소설(경영·자기계발·에세이)"}
            </button>
          ))}
        </div>
        <label className={`${label} mt-4`}>
          분야 / 장르
          <input className={`${input} mt-1`} value={p.genre} maxLength={FIELD_LIMIT.short} placeholder={p.kind === "fiction" ? "예: 판타지, 미스터리" : "예: 공간 브랜딩, 소상공인 창업"} onChange={(e) => set({ genre: e.target.value })} />
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
          처음 생각 — 쓰고 싶은 이야기, 떠오르는 경험(없어도 됩니다)
          {area(p.premise, (v) => set({ premise: v }), "min-h-[88px]", FIELD_LIMIT.medium)}
        </label>
      </section>

      {/* 방식 선택 */}
      <div className="mt-6 flex gap-2">
        {([["fractal", "기획부터 (판매용)"], ["discovery", "한 장면씩 (즉흥 집필)"]] as const).map(([m, name]) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`h-12 flex-1 rounded-full text-[15px] font-semibold ${mode === m ? "bg-[#8C4A32] text-white" : "border border-[#D5CFC3] text-[#5C5346]"}`}>
            {name}
          </button>
        ))}
      </div>

      {(error || notice) && (
        <p role="status" className={`sticky top-2 z-10 mt-4 rounded-2xl px-5 py-4 text-[15px] leading-relaxed shadow-sm ${error ? "bg-[#FBEDE8] text-[#8C4A32]" : "bg-[#EEF3EF] text-[#4E6B57]"}`}>
          {error ?? notice}
        </p>
      )}

      {mode === "fractal" ? (
        <>
          <Phase name="1부 · 기획 — 팔릴 이유 만들기" />

          <StepBox id="s-market" n={1} title="시장 기획">
            <p className="text-[15px] leading-relaxed text-[#6B6255]">
              팔리는 책의 절반은 여기서 정해집니다. 아래 칸들은 AI가 대신 채울 수 없습니다 — 작가만 아는 사실이고, 경쟁 도서는 서점에서 직접 확인해야 합니다.
            </p>
            <label className={`${label} mt-4`}>
              대상 독자 — 한 사람을 떠올리듯 구체적으로
              {area(p.reader, (v) => set({ reader: v }), "min-h-[72px]", FIELD_LIMIT.medium, "예: 퇴직을 앞두고 카페 창업을 고민하는 50대 직장인")}
            </label>
            <label className={`${label} mt-4`}>
              그 독자의 문제·욕구 — 돈을 내고라도 해결하고 싶은 것
              {area(p.problem, (v) => set({ problem: v }), "min-h-[72px]", FIELD_LIMIT.medium)}
            </label>
            <label className={`${label} mt-4`}>
              경쟁 도서 3~5권
              <span className={hint}>교보문고·예스24에서 같은 분야 상위 도서를 직접 찾아 제목·저자·잘 팔리는 이유·아쉬운 점을 적으세요. AI는 실제 책 제목과 판매량을 지어낼 수 있어서, 여기 적힌 책만 비교하게 했습니다.</span>
              {area(p.comps, (v) => set({ comps: v }), "min-h-[120px]")}
            </label>
            <label className={`${label} mt-4`}>
              지은이 이름
              <input className={`${input} mt-1`} value={p.author} maxLength={FIELD_LIMIT.short} onChange={(e) => set({ author: e.target.value })} />
            </label>
            <label className={`${label} mt-4`}>
              저자 정보 — 경력·실적·강연·운영 채널 등 사실만
              <span className={hint}>저자 소개와 투고 기획서는 여기 적힌 사실만 씁니다. 숫자는 확인된 것만 적어 주세요.</span>
              {area(p.authorInfo, (v) => set({ authorInfo: v }), "min-h-[100px]", FIELD_LIMIT.medium)}
            </label>
            <h3 className="mt-5 text-[16px] font-bold">포지셔닝 · 독자 약속 · 검색 키워드 · 약점</h3>
            {actions("market", () => genInto("market", p.positioning, (t) => set({ positioning: t })), !p.reader.trim() && !p.premise.trim())}
            {area(p.positioning, (v) => set({ positioning: v }), "mt-3 min-h-[200px]")}
          </StepBox>

          <StepBox id="s-ideas" n={2} title="아이디어 5가지">
            {actions("ideas", () => genInto("ideas", p.ideas, (t) => set({ ideas: t })))}
            {area(p.ideas, (v) => set({ ideas: v }), "mt-3 min-h-[160px]")}
            <label className={`${label} mt-4`}>
              고른 아이디어 — 위에서 옮겨 적고 마음대로 고치세요
              {area(p.idea, (v) => set({ idea: v }), "min-h-[100px]", FIELD_LIMIT.medium)}
            </label>
          </StepBox>

          <StepBox id="s-bible" n={3} title={p.kind === "fiction" ? "기획서 (스토리 바이블)" : "기획서"}>
            <p className="text-[15px] leading-relaxed text-[#6B6255]">
              {p.kind === "fiction" ? "인물 3명 · 배경 3가지 · 절정과 결말." : "핵심 메시지 · 독자 약속 · 저자 자격 · 장마다 쓸 실제 경험."} 이후 모든 단계의 기준 문서입니다. Claude 프로젝트에 올려두면 매번 붙여넣지 않아도 됩니다.
            </p>
            {actions("bible", () => genInto("bible", p.bible, (t) => set({ bible: t })), !p.idea.trim())}
            {area(p.bible, (v) => set({ bible: v }), "mt-3 min-h-[220px]")}
            {p.kind === "nonfiction" && (
              <label className={`${label} mt-4`}>
                근거 자료 — 수치·통계·연구·인용과 출처
                <span className={hint}>AI는 여기 있는 것만 인용하고, 없으면 [확인 필요]로 비워둡니다. Perplexity 같은 검색형 AI로 모으고 출처를 꼭 함께 적으세요.</span>
                {area(p.sources, (v) => set({ sources: v }), "min-h-[140px]")}
              </label>
            )}
          </StepBox>

          <StepBox id="s-title" n={4} title="제목 · 부제">
            <p className="text-[15px] leading-relaxed text-[#6B6255]">
              약속형 · 호기심형 · 정체성형 · 키워드형으로 10개를 받고 추천 3개와 이유를 봅니다. 고른 것을 아래 칸에 적으세요.
            </p>
            {actions("titles", () => genInto("titles", p.titleIdeas, (t) => set({ titleIdeas: t })), !p.bible.trim() && !p.positioning.trim())}
            {area(p.titleIdeas, (v) => set({ titleIdeas: v }), "mt-3 min-h-[200px]")}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={label}>
                제목
                <input className={`${input} mt-1`} value={p.title} maxLength={FIELD_LIMIT.short} onChange={(e) => set({ title: e.target.value })} />
              </label>
              <label className={label}>
                부제
                <input className={`${input} mt-1`} value={p.subtitle} maxLength={FIELD_LIMIT.short} onChange={(e) => set({ subtitle: e.target.value })} />
              </label>
            </div>
          </StepBox>

          <Phase name="2부 · 집필" />

          <StepBox id="s-outline" n={5} title="목차 — 목차만 읽어도 사고 싶게">
            <div className="grid grid-cols-2 gap-4">
              <label className={label}>
                장 수
                <input type="number" min={3} max={60} className={`${input} mt-1`} value={p.chapterCount} onChange={(e) => set({ chapterCount: Math.max(3, Math.min(60, Number(e.target.value) || 12)) })} />
              </label>
              <label className={label}>
                목표 분량(쪽)
                <input type="number" min={30} max={1000} className={`${input} mt-1`} value={p.targetPages} onChange={(e) => set({ targetPages: Math.max(30, Math.min(1000, Number(e.target.value) || 240)) })} />
              </label>
            </div>
            <p className="mt-2 text-[14px] text-[#A8998A]">
              한 장 목표 약 {perChapter.toLocaleString()}자 (한 쪽 {CHARS_PER_PAGE}자 환산 · 실제 쪽수는 판형과 편집에 따라 달라집니다)
            </p>
            {actions("outline", genOutline, !p.bible.trim())}
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
            <button type="button" onClick={() => update((prev) => ({ ...prev, chapters: [...prev.chapters, { title: "", summary: "", beats: "", draft: "", review: "" }] }))} className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#8C4A32]">
              <Plus className="h-4 w-4" /> 장 직접 추가
            </button>
          </StepBox>

          <StepBox id="s-write" n={6} title="장별 집필 — 설계 → 초안 → 이어 쓰기 → 편집자 검토">
            {p.chapters.length === 0 ? (
              <p className="text-[15px] text-[#6B6255]">5단계에서 목차를 먼저 만들어 주세요.</p>
            ) : (
              <>
                <select className={input} value={chapterIdx} onChange={(e) => setChapterIdx(Number(e.target.value))}>
                  {p.chapters.map((c, i) => (
                    <option key={i} value={i}>
                      {i + 1}장. {c.title || "(제목 없음)"} · {countChars(c.draft).toLocaleString()}자{c.review.trim() ? " · 검토함" : ""}
                    </option>
                  ))}
                </select>
                {chapter && (
                  <>
                    <p className="mt-3 text-[15px] leading-relaxed text-[#6B6255]">{chapter.summary}</p>

                    <h3 className="mt-5 text-[16px] font-bold">① 장 설계 (12~15단계)</h3>
                    <p className="mt-1 text-[14px] text-[#A8998A]">
                      {p.kind === "nonfiction" ? "첫 문단 훅 → 문제 → 핵심 개념 → 사례 → 실행 도구 → 한 줄 정리 순서로 나눕니다." : "장 끝이 다음 장을 넘기게 만드는 질문·위기·반전이 되도록 나눕니다."}
                    </p>
                    {actions("beats", () => genInto("beats", chapter.beats, (t) => setChapter(chapterIdx, { beats: t })))}
                    {area(chapter.beats, (v) => setChapter(chapterIdx, { beats: v }), "mt-3 min-h-[180px]")}

                    <h3 className="mt-5 text-[16px] font-bold">② 초안</h3>
                    <p className="mt-1 text-[14px] text-[#A8998A]">
                      한 번에 약 {DRAFT_CHUNK_CHARS.toLocaleString()}자씩 씁니다. 목표까지 「이어 쓰기」로 채우세요.
                      {p.styleSample.trim() ? " 7단계 문체 견본을 따라 씁니다." : " 7단계에 문체 견본을 넣으면 그 문체로 씁니다."}
                    </p>
                    {actions(
                      "draft",
                      () => genInto("draft", chapter.draft, (t) => setChapter(chapterIdx, { draft: t })),
                      !chapter.beats.trim(),
                      "처음부터 쓰기",
                      <button type="button" onClick={genContinue} disabled={!chapter.draft.trim() || busy !== null} className={ghostBtn}>
                        <Plus className="h-4 w-4" /> {busy === "continue" ? "쓰는 중…" : "이어 쓰기"}
                      </button>
                    )}
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EFEAE1]">
                      <div className="h-full bg-[#4E6B57]" style={{ width: `${pct(countChars(chapter.draft), perChapter)}%` }} />
                    </div>
                    <p className="mt-1 text-[14px] text-[#6B6255]">
                      {countChars(chapter.draft).toLocaleString()}자 / 목표 약 {perChapter.toLocaleString()}자
                    </p>
                    {area(chapter.draft, (v) => setChapter(chapterIdx, { draft: v }), "mt-2 min-h-[360px]", FIELD_LIMIT.chapter)}

                    <h3 className="mt-5 text-[16px] font-bold">③ 편집자 검토</h3>
                    <p className="mt-1 text-[14px] text-[#A8998A]">
                      원고를 대신 고치지 않습니다. 점수표 · 먼저 고칠 5가지 · 잘라낼 부분 · 사실 확인 목록을 받고 작가가 직접 고칩니다.
                    </p>
                    {actions("review", () => genInto("review", chapter.review, (t) => setChapter(chapterIdx, { review: t })), countChars(chapter.draft) < 200, "검토 받기")}
                    {area(chapter.review, (v) => setChapter(chapterIdx, { review: v }), "mt-3 min-h-[200px]")}
                  </>
                )}
              </>
            )}
          </StepBox>

          <StepBox id="s-style" n={7} title="문체 견본 (Human Touch)">
            <p className="text-[15px] leading-relaxed text-[#6B6255]">
              AI가 쓴 1장을 직접 어조·사례·말버릇까지 고쳐 여기에 두세요. 이후 초안과 이어 쓰기는 이 문체를 따라 씁니다. 독자는 AI 문체가 아니라 저자의 목소리에 돈을 냅니다.
            </p>
            {p.chapters[0]?.draft.trim() && (
              <button type="button" onClick={() => { if (okToReplace(p.styleSample)) set({ styleSample: p.chapters[0].draft.slice(0, FIELD_LIMIT.long) }); }} className="mt-3 text-[15px] font-semibold text-[#8C4A32] underline underline-offset-4">
                1장 초안을 가져와서 고치기
              </button>
            )}
            {area(p.styleSample, (v) => set({ styleSample: v }), "mt-3 min-h-[240px]")}
          </StepBox>

          <Phase name="3부 · 출간 준비" />

          <StepBox id="s-sales" n={8} title="판매 문안 — 뒷표지 · 서점 책 소개 · 저자 소개 · 투고 기획서">
            <p className="text-[15px] leading-relaxed text-[#6B6255]">
              출판사 투고와 온라인 서점 등록에 쓰는 문안입니다. “베스트셀러”·“최초” 같은 확인할 수 없는 표현과 없는 추천사는 쓰지 않게 했습니다.
            </p>
            {actions("sales", () => genInto("sales", p.sales, (t) => set({ sales: t })), !p.bible.trim())}
            {area(p.sales, (v) => set({ sales: v }), "mt-3 min-h-[320px]")}
            <p className="mt-4 text-[14px] leading-relaxed text-[#A8998A]">
              투고 원고는 맨 위 「투고 원고(Word)」로 내려받습니다 — 표지 · 차례 · 장마다 새 쪽.
            </p>
          </StepBox>
        </>
      ) : (
        <StepBox id="s-discovery" n={1} title="즉흥 집필 — 한 장면씩 이어 쓰기">
          <p className="text-[15px] leading-relaxed text-[#6B6255]">
            목차 없이 다음 장면에서 일어날 일을 1~2문장으로 적으면 400~800자 장면을 이어 씁니다. 결과를 읽고 고친 뒤 다음 장면으로 넘어가세요.
          </p>
          <label className={`${label} mt-4`}>
            다음 장면
            {area(beat, setBeat, "min-h-[88px]", FIELD_LIMIT.medium, "예: 주인공이 경찰서에 들어와 의자에 앉는다. 커피머신이 고장 났다며 불평한다.")}
          </label>
          {actions("scene", genScene, !beat.trim(), "이어 쓰기")}
          {area(p.discovery, (v) => set({ discovery: v }), "mt-4 min-h-[420px]", FIELD_LIMIT.chapter * 5)}
        </StepBox>
      )}
      </>
      )}
    </div>
  );
}

function Phase({ name }: { name: string }) {
  return <h2 className="mt-10 text-[14px] font-semibold tracking-[0.15em] text-[#A8998A]">{name}</h2>;
}

function StepBox({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-4 scroll-mt-20 rounded-3xl bg-white p-5 sm:p-7">
      <h2 className="text-[20px] font-bold">
        <span className="mr-2 text-[#8C4A32]">{n}</span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
