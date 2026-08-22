"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, FileText, FileUp, Printer, Upload } from "lucide-react";
import { CHAPTERS, PARTS } from "@/lib/memoir/questions";
import {
  CHARS_PER_PAGE,
  buildManuscript,
  emptyBook,
  progressOf,
  toMarkdown,
  type MemoirBook,
} from "@/lib/memoir/manuscript";
import { backupFileName, downloadText, useMemoirBook } from "@/lib/memoir/storage";
import {
  REVIEW_NOTICE,
  buildDocxBlob,
  hasContent,
  manuscriptFileName,
} from "@/lib/memoir/exportDoc";

export function BookClient() {
  const { book, ready, saveState, setMeta, addNote, removeNote, replaceBook } = useMemoirBook();
  const [tab, setTab] = useState<"progress" | "preview">("progress");
  const [pasteText, setPasteText] = useState("");
  const [pasteChapter, setPasteChapter] = useState(CHAPTERS[0].id);
  const [pasteTitle, setPasteTitle] = useState("");
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [docxState, setDocxState] = useState<"idle" | "working" | "error">("idle");
  const fileInput = useRef<HTMLInputElement>(null);

  const progress = useMemo(() => progressOf(book), [book]);
  const manuscript = useMemo(() => buildManuscript(book), [book]);

  function exportMarkdown() {
    downloadText(backupFileName("md"), toMarkdown(book), "text/markdown");
  }

  /**
   * Word(.docx)로 내보낸다. docx 패키지가 무거워 누를 때만 불러온다 —
   * 그래서 잠깐 걸릴 수 있고, 그동안 버튼에 상태를 보여준다.
   */
  async function exportDocx() {
    setDocxState("working");
    try {
      const blob = await buildDocxBlob(book);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = manuscriptFileName(book.title, "docx");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDocxState("idle");
    } catch (error) {
      console.error("[memoir] docx 내보내기 실패:", error);
      setDocxState("error");
    }
  }

  function exportJson() {
    downloadText(backupFileName("json"), JSON.stringify(book, null, 2), "application/json");
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<MemoirBook>;
        if (typeof parsed !== "object" || parsed === null || !parsed.answers) {
          setRestoreMessage("자서전 백업 파일이 아닙니다.");
          return;
        }
        // 되돌릴 수 없는 덮어쓰기다. 반드시 확인을 받는다(§0-2 원칙 6).
        const ok = window.confirm(
          "지금 이 휴대폰에 저장된 원고를 백업 파일의 내용으로 바꿉니다. 되돌릴 수 없습니다. 계속할까요?"
        );
        if (!ok) return;
        replaceBook({ ...emptyBook(), ...parsed, answers: parsed.answers, notes: parsed.notes ?? [] });
        setRestoreMessage("불러왔습니다.");
      } catch {
        setRestoreMessage("파일을 읽지 못했습니다.");
      }
    };
    reader.readAsText(file);
  }

  function savePaste() {
    if (!pasteText.trim()) return;
    addNote({ chapterId: pasteChapter, title: pasteTitle.trim() || "가져온 원고", text: pasteText });
    setPasteText("");
    setPasteTitle("");
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-[26px] font-bold text-[#1B1815]">내 원고</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[#6B6255]">
        {ready ? "이 휴대폰(브라우저) 안에만 저장되어 있습니다." : "불러오는 중…"}
        {saveState === "error" && (
          <span className="ml-1 font-semibold text-[#8C4A32]">저장에 실패했습니다. 지금 내보내기를 해두세요.</span>
        )}
      </p>

      {/* 책 정보 */}
      <div className="mt-6 space-y-3 rounded-2xl border border-[#E5DFD4] bg-white p-5">
        <label className="block">
          <span className="text-[14px] font-semibold text-[#5C5346]">책 제목</span>
          <input
            value={book.title}
            onChange={(e) => setMeta({ title: e.target.value })}
            placeholder="아직 정하지 않으셨다면 비워두세요"
            className="mt-1 h-12 w-full rounded-xl border border-[#D5CFC3] px-4 text-[16px] text-[#1B1815] outline-none focus:border-[#8C4A32]"
          />
        </label>
        <label className="block">
          <span className="text-[14px] font-semibold text-[#5C5346]">부제</span>
          <input
            value={book.subtitle}
            onChange={(e) => setMeta({ subtitle: e.target.value })}
            className="mt-1 h-12 w-full rounded-xl border border-[#D5CFC3] px-4 text-[16px] text-[#1B1815] outline-none focus:border-[#8C4A32]"
          />
        </label>
        <label className="block">
          <span className="text-[14px] font-semibold text-[#5C5346]">지은이</span>
          <input
            value={book.author}
            onChange={(e) => setMeta({ author: e.target.value })}
            className="mt-1 h-12 w-full rounded-xl border border-[#D5CFC3] px-4 text-[16px] text-[#1B1815] outline-none focus:border-[#8C4A32]"
          />
        </label>
      </div>

      {/* 분량 */}
      <div className="mt-6 rounded-2xl bg-[#1B1815] p-6 text-white">
        <p className="text-[14px] text-white/70">지금까지 쓴 분량</p>
        <p className="mt-1 text-[34px] font-bold leading-none">
          약 {progress.pages}
          <span className="ml-1 text-[18px] font-medium text-white/70">쪽</span>
        </p>
        <p className="mt-2 text-[15px] text-white/80">
          {progress.chars.toLocaleString()}자 · 답변한 질문 {progress.answered} / {progress.totalQuestions}
        </p>
        <div className="mt-4 h-2 w-full rounded-full bg-white/20">
          <div className="h-2 rounded-full bg-[#D9A88E]" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-white/60">
          목표 {progress.targetPages}쪽까지 {progress.percent}%. 한 쪽을 {CHARS_PER_PAGE}자로 환산한
          값이며, 실제 인쇄 쪽수는 판형·글자 크기·사진에 따라 달라집니다.
        </p>
      </div>

      {/* 내보내기 — 가장 위에 둔다. 브라우저 데이터가 지워지면 원고가 사라지기 때문이다. */}
      <div className="mt-6 rounded-2xl border-2 border-[#8C4A32] bg-[#FDF7F3] p-5">
        <p className="text-[16px] font-bold text-[#8C4A32]">원고를 꼭 내보내 두세요</p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#5C5346]">
          원고는 이 휴대폰 안에만 있습니다. 브라우저 기록을 지우거나 기기를 바꾸면 사라집니다.
          며칠에 한 번은 파일로 내려받아 메일이나 클라우드에 보관해 주세요.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportDocx}
            disabled={!hasContent(book) || docxState === "working"}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#8C4A32] px-5 text-[15px] font-semibold text-white disabled:opacity-40"
          >
            <FileText className="h-4 w-4" />
            {docxState === "working" ? "만드는 중…" : "Word로 받기"}
          </button>
          <Link
            href="/memoir/print"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-[#8C4A32] px-5 text-[15px] font-semibold text-[#8C4A32]"
          >
            <Printer className="h-4 w-4" /> PDF로 저장
          </Link>
          <button
            type="button"
            onClick={exportMarkdown}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-[#D5CFC3] px-5 text-[15px] text-[#5C5346]"
          >
            <Download className="h-4 w-4" /> 원고 파일(.md)
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-[#D5CFC3] px-5 text-[15px] text-[#5C5346]"
          >
            <Upload className="h-4 w-4" /> 백업 파일(.json)
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-[#D5CFC3] px-5 text-[15px] text-[#5C5346]"
          >
            <FileUp className="h-4 w-4" /> 백업 불러오기
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importJson(file);
              e.target.value = "";
            }}
          />
        </div>
        {docxState === "error" && (
          <p className="mt-3 text-[15px] text-[#8C4A32]">
            Word 파일을 만들지 못했습니다. 다시 눌러 주세요. 계속 안 되면 「원고 파일(.md)」로 받으실 수 있습니다.
          </p>
        )}
        {restoreMessage && <p className="mt-3 text-[15px] text-[#8C4A32]">{restoreMessage}</p>}
        <p className="mt-4 border-t border-[#E7D9CE] pt-3 text-[14px] leading-relaxed text-[#8C4A32]">
          {REVIEW_NOTICE}
        </p>
      </div>

      {/* 탭 */}
      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("progress")}
          className={`h-11 flex-1 rounded-full text-[15px] font-semibold ${
            tab === "progress" ? "bg-[#1B1815] text-white" : "border border-[#D5CFC3] text-[#5C5346]"
          }`}
        >
          장별 진행
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`h-11 flex-1 rounded-full text-[15px] font-semibold ${
            tab === "preview" ? "bg-[#1B1815] text-white" : "border border-[#D5CFC3] text-[#5C5346]"
          }`}
        >
          원고 미리보기
        </button>
      </div>

      {tab === "progress" && (
        <div className="mt-5 space-y-6">
          {PARTS.map((part) => (
            <section key={part.id}>
              <p className="text-[13px] font-semibold tracking-widest text-[#A8998A]">
                {part.label} · {part.title}
              </p>
              <ul className="mt-2 space-y-2">
                {progress.byChapter
                  .filter((c) => c.chapter.partId === part.id)
                  .map((c) => (
                    <li
                      key={c.chapter.id}
                      className="flex items-center justify-between rounded-xl border border-[#E5DFD4] bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-[16px] font-semibold text-[#1B1815]">{c.chapter.title}</p>
                        <p className="mt-0.5 text-[14px] text-[#6B6255]">
                          {c.answered} / {c.total} 문항 · 약 {c.pages}쪽
                        </p>
                      </div>
                      <span className="text-[14px] font-semibold text-[#8C4A32]">
                        {Math.round((c.answered / c.total) * 100)}%
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {tab === "preview" && (
        <div className="mt-5">
          {manuscript.length === 0 ? (
            <p className="rounded-2xl bg-[#F1EDE6] px-5 py-8 text-center text-[16px] text-[#6B6255]">
              아직 쓴 글이 없습니다.{" "}
              <Link href="/memoir/write" className="text-[#8C4A32] underline underline-offset-4">
                첫 질문부터 시작하기
              </Link>
            </p>
          ) : (
            <div className="space-y-8 rounded-2xl border border-[#E5DFD4] bg-white px-5 py-6">
              {manuscript.map((item) => (
                <section key={item.chapter.id}>
                  <h2 className="text-[19px] font-bold text-[#1B1815]">{item.chapter.title}</h2>
                  <p className="mt-1 text-[14px] text-[#A8998A]">{item.chapter.subtitle}</p>
                  <div className="mt-4 space-y-5">
                    {item.entries.map((entry, i) => (
                      <div key={`${item.chapter.id}-${i}`}>
                        <p className="text-[14px] font-semibold text-[#8C4A32]">{entry.heading}</p>
                        <p className="mt-2 whitespace-pre-wrap text-[16px] leading-[1.9] text-[#1B1815]">
                          {entry.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 기존 원고 가져오기 */}
      <div className="mt-10 rounded-2xl border border-[#E5DFD4] bg-white p-5">
        <p className="text-[16px] font-bold text-[#1B1815]">이미 써둔 글 붙여넣기</p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#6B6255]">
          예전에 써둔 원고가 있다면 여기에 붙여넣고 어느 장에 넣을지 골라 주세요. 원고에 그대로 들어갑니다.
        </p>
        <input
          value={pasteTitle}
          onChange={(e) => setPasteTitle(e.target.value)}
          placeholder="소제목 (비워도 됩니다)"
          className="mt-3 h-12 w-full rounded-xl border border-[#D5CFC3] px-4 text-[16px] outline-none focus:border-[#8C4A32]"
        />
        <select
          value={pasteChapter}
          onChange={(e) => setPasteChapter(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-[#D5CFC3] bg-white px-3 text-[16px] text-[#1B1815]"
        >
          {CHAPTERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} — {c.subtitle}
            </option>
          ))}
        </select>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="여기에 붙여넣으세요."
          className="mt-2 min-h-[160px] w-full rounded-xl border border-[#D5CFC3] p-4 text-[16px] leading-[1.8] outline-none focus:border-[#8C4A32]"
        />
        <button
          type="button"
          onClick={savePaste}
          disabled={!pasteText.trim()}
          className="mt-3 h-12 w-full rounded-full bg-[#1B1815] text-[16px] font-semibold text-white disabled:opacity-40"
        >
          원고에 넣기
        </button>

        {book.notes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {book.notes.map((note) => (
              <li
                key={note.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-[#F1EDE6] px-4 py-3"
              >
                <span className="text-[15px] text-[#5C5346]">
                  {note.title} · {CHAPTERS.find((c) => c.id === note.chapterId)?.title}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`"${note.title}"을(를) 원고에서 지웁니다. 계속할까요?`)) {
                      removeNote(note.id);
                    }
                  }}
                  className="shrink-0 text-[14px] text-[#8C4A32] underline underline-offset-4"
                >
                  지우기
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/memoir/write"
          className="inline-flex h-14 items-center justify-center rounded-full bg-[#8C4A32] px-8 text-[16px] font-semibold text-white"
        >
          이어서 쓰기
        </Link>
      </div>
    </div>
  );
}
