import type { BookBasics, OutlineChapter } from "@/lib/bookwriter/prompts";

/**
 * 책 한 권의 작업 상태. 브라우저에만 저장한다(lib/bookwriter/storage.ts).
 * 각 단계의 AI 결과는 작가가 고칠 수 있는 글로 그대로 둔다 — 다음 단계는 "고친 글"을 기준으로 삼는다.
 */
export interface BookChapter extends OutlineChapter {
  beats: string;
  draft: string;
}

export interface BookProject extends BookBasics {
  title: string;
  ideas: string;
  /** 고른 아이디어(아이디어 목록에서 옮겨 적거나 직접 쓴다) */
  idea: string;
  bible: string;
  sources: string;
  chapterCount: number;
  chapters: BookChapter[];
  /** 작가가 직접 고친 1장 등 — 이후 초안의 문체 기준 */
  styleSample: string;
  /** 즉흥 집필 원고 */
  discovery: string;
  updatedAt: string;
}

export function emptyProject(): BookProject {
  return {
    kind: "fiction",
    genre: "",
    premise: "",
    pov: "3인칭 제한 시점",
    tense: "과거형",
    title: "",
    ideas: "",
    idea: "",
    bible: "",
    sources: "",
    chapterCount: 12,
    chapters: [],
    styleSample: "",
    discovery: "",
    updatedAt: "",
  };
}

/** 저장된 값이 예전 모양이거나 일부 깨져 있어도 빈 화면 대신 채워서 연다. */
export function normalizeProject(raw: unknown): BookProject {
  const base = emptyProject();
  if (!raw || typeof raw !== "object") return base;
  const p = { ...base, ...(raw as Partial<BookProject>) };
  p.chapters = Array.isArray(p.chapters)
    ? p.chapters.map((c) => ({
        title: String(c?.title ?? ""),
        summary: String(c?.summary ?? ""),
        beats: String(c?.beats ?? ""),
        draft: String(c?.draft ?? ""),
      }))
    : [];
  return p;
}

/** 원고 글자 수(공백 제외) — 진행 정도를 보여줄 때 쓴다. */
export function countChars(text: string): number {
  return text.replace(/\s/g, "").length;
}

export function manuscriptChars(p: BookProject): number {
  return p.chapters.reduce((sum, c) => sum + countChars(c.draft), 0) + countChars(p.discovery);
}

/** 내려받기용 원고(.md). 초안이 있는 장만 싣고, 즉흥 집필 원고는 뒤에 붙인다. */
export function toMarkdown(p: BookProject): string {
  const parts: string[] = [`# ${p.title.trim() || "제목 없음"}`];
  p.chapters.forEach((c, i) => {
    if (!c.draft.trim()) return;
    parts.push(`## ${i + 1}장. ${c.title.trim()}`, c.draft.trim());
  });
  if (p.discovery.trim()) parts.push("## 즉흥 집필 원고", p.discovery.trim());
  return `${parts.join("\n\n")}\n`;
}
