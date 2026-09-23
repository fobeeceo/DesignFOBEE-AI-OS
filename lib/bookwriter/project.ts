import type { BookBasics, OutlineChapter } from "@/lib/bookwriter/prompts";
import { CHARS_PER_PAGE } from "@/lib/memoir/pageSize";

/**
 * 책 한 권의 작업 상태. 브라우저에만 저장한다(lib/bookwriter/storage.ts).
 * 각 단계의 AI 결과는 작가가 고칠 수 있는 글로 그대로 둔다 — 다음 단계는 "고친 글"을 기준으로 삼는다.
 */
export interface BookChapter extends OutlineChapter {
  beats: string;
  draft: string;
  /** 편집자 검토 결과. 원고를 대신 고치지 않고 고칠 점만 남긴다. */
  review: string;
}

export interface BookProject extends BookBasics {
  title: string;
  subtitle: string;
  /** 지은이 이름(표지·투고 원고에 쓴다) */
  author: string;
  /** 시장 기획 — 작가가 조사해서 적는 칸 */
  reader: string;
  problem: string;
  comps: string;
  /** 저자 소개 재료. 판매 문안의 저자 소개는 여기 적힌 사실만 쓴다. */
  authorInfo: string;
  /** 시장 기획 단계 결과(포지셔닝) */
  positioning: string;
  ideas: string;
  /** 고른 아이디어(아이디어 목록에서 옮겨 적거나 직접 쓴다) */
  idea: string;
  bible: string;
  sources: string;
  /** 제목 후보(AI 결과) — 고른 것은 title·subtitle에 옮겨 적는다 */
  titleIdeas: string;
  chapterCount: number;
  /** 목표 분량(쪽). 장별 목표 글자 수는 여기서 자동 계산한다(§0-2 원칙 5). */
  targetPages: number;
  chapters: BookChapter[];
  /** 작가가 직접 고친 1장 등 — 이후 초안의 문체 기준 */
  styleSample: string;
  /** 뒷표지·책 소개·저자 소개·투고 기획서 */
  sales: string;
  /** 즉흥 집필 원고 */
  discovery: string;
  updatedAt: string;
}

/**
 * 목표 분량 기본값. 국내 비소설 단행본은 신국판 200~300쪽이 흔해서 그 가운데를 잡았다.
 * 기본값일 뿐 화면에서 바꾼다.
 */
export const DEFAULT_TARGET_PAGES = 240;

export function emptyProject(): BookProject {
  return {
    kind: "nonfiction",
    genre: "",
    premise: "",
    pov: "3인칭 제한 시점",
    tense: "과거형",
    title: "",
    subtitle: "",
    author: "",
    reader: "",
    problem: "",
    comps: "",
    authorInfo: "",
    positioning: "",
    ideas: "",
    idea: "",
    bible: "",
    sources: "",
    titleIdeas: "",
    chapterCount: 12,
    targetPages: DEFAULT_TARGET_PAGES,
    chapters: [],
    styleSample: "",
    sales: "",
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
        review: String(c?.review ?? ""),
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

export function targetChars(p: BookProject): number {
  return p.targetPages * CHARS_PER_PAGE;
}

/** 장 하나의 목표 글자 수. 장 수나 목표 쪽수를 바꾸면 저절로 다시 계산된다. */
export function chapterTarget(p: BookProject): number {
  const n = p.chapters.length || p.chapterCount;
  return n > 0 ? Math.round(targetChars(p) / n / 100) * 100 : 0;
}

export function toPages(chars: number): number {
  return Math.round(chars / CHARS_PER_PAGE);
}

/** 원고에 초안이 있는 장만 — .md와 .docx가 같은 목록을 쓴다(§14-A ⑥). */
export function writtenChapters(p: BookProject): { no: number; title: string; body: string }[] {
  return p.chapters
    .map((c, i) => ({ no: i + 1, title: c.title.trim(), body: c.draft.trim() }))
    .filter((c) => c.body);
}

/** 내려받기용 원고(.md). 초안이 있는 장만 싣고, 즉흥 집필 원고는 뒤에 붙인다. */
export function toMarkdown(p: BookProject): string {
  const parts: string[] = [`# ${p.title.trim() || "제목 없음"}`];
  if (p.subtitle.trim()) parts.push(`*${p.subtitle.trim()}*`);
  for (const c of writtenChapters(p)) parts.push(`## ${c.no}장. ${c.title}`, c.body);
  if (p.discovery.trim()) parts.push("## 즉흥 집필 원고", p.discovery.trim());
  return `${parts.join("\n\n")}\n`;
}
