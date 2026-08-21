import {
  CHAPTERS,
  PARTS,
  QUESTIONS,
  QUESTIONS_BY_CHAPTER,
  type MemoirChapter,
  type MemoirQuestion,
} from "@/lib/memoir/questions";

/**
 * 원고 분량 환산 기준.
 *
 * 대표 원고 「유리 벽돌을 쌓다」(2026-08, PDF 75쪽)의 본문 추출 결과가 49,517자였다.
 * 49,517 / 75 ≈ 660자/쪽. 일반적인 신국판 단행본(600~700자/쪽) 범위와도 맞는다.
 *
 * ⚠️ 어디까지나 환산 기준이다. 실제 인쇄 쪽수는 판형·서체·행간·사진에 따라 달라진다.
 *    화면에는 반드시 "약"을 붙여 표시하고, 확정 수치처럼 쓰지 않는다(§0-2 원칙 3).
 */
export const CHARS_PER_PAGE = 660;

/** 목표 분량. 대표 지시(2026-08-21): 300쪽 분량의 책 한 권. */
export const TARGET_PAGES = 300;

export const TARGET_CHARS = TARGET_PAGES * CHARS_PER_PAGE;

/** 질문 하나가 감당해야 하는 평균 분량. 질문 수가 늘면 자동으로 줄어든다(§0-2 원칙 5). */
export const CHARS_PER_QUESTION = Math.round(TARGET_CHARS / QUESTIONS.length);

/** 답변 한 건. 텍스트가 정본이고, 음성은 받아쓴 결과를 텍스트로 저장한다. */
export type MemoirAnswer = {
  questionId: string;
  text: string;
  /** 마지막으로 저장한 시각 (ISO). */
  updatedAt: string;
  /** 음성으로 받아쓴 부분이 포함되어 있는가. 나중에 교정 우선순위를 잡는 데 쓴다. */
  fromVoice?: boolean;
};

/** 질문 없이 직접 써둔 글(기존 원고 가져오기 포함). */
export type MemoirNote = {
  id: string;
  chapterId: string;
  title: string;
  text: string;
  updatedAt: string;
};

export type MemoirBook = {
  /** 저자명. 비어 있으면 화면에 "이름을 적어 주세요"로 안내한다 — 지어내지 않는다(§14-A ②). */
  author: string;
  title: string;
  subtitle: string;
  answers: Record<string, MemoirAnswer>;
  notes: MemoirNote[];
};

export function emptyBook(): MemoirBook {
  return { author: "", title: "", subtitle: "", answers: {}, notes: [] };
}

/**
 * 글자 수. 공백은 한 칸으로 눌러 세고 줄바꿈은 세지 않는다.
 * 구술을 받아쓰면 공백·줄바꿈이 불규칙하게 들어와서, 그대로 세면 분량이 부풀려진다.
 */
export function countChars(text: string): number {
  return text.replace(/\s+/g, " ").trim().length;
}

/** 환산 쪽수. 0자면 0쪽. */
export function toPages(chars: number): number {
  if (chars <= 0) return 0;
  return Math.round((chars / CHARS_PER_PAGE) * 10) / 10;
}

export type ChapterProgress = {
  chapter: MemoirChapter;
  answered: number;
  total: number;
  chars: number;
  pages: number;
};

export type BookProgress = {
  answered: number;
  totalQuestions: number;
  chars: number;
  pages: number;
  targetPages: number;
  /** 목표 대비 진행률 0~100. 넘어가도 100에서 자른다. */
  percent: number;
  byChapter: ChapterProgress[];
};

export function progressOf(book: MemoirBook): BookProgress {
  const byChapter = CHAPTERS.map<ChapterProgress>((chapter) => {
    const questions = QUESTIONS_BY_CHAPTER[chapter.id] ?? [];
    let chars = 0;
    let answered = 0;

    for (const q of questions) {
      const n = countChars(book.answers[q.id]?.text ?? "");
      if (n > 0) {
        answered += 1;
        chars += n;
      }
    }
    for (const note of book.notes) {
      if (note.chapterId === chapter.id) chars += countChars(note.text);
    }

    return {
      chapter,
      answered,
      total: questions.length,
      chars,
      pages: toPages(chars),
    };
  });

  const chars = byChapter.reduce((sum, c) => sum + c.chars, 0);
  const answered = byChapter.reduce((sum, c) => sum + c.answered, 0);

  return {
    answered,
    totalQuestions: QUESTIONS.length,
    chars,
    pages: toPages(chars),
    targetPages: TARGET_PAGES,
    percent: Math.min(100, Math.round((chars / TARGET_CHARS) * 100)),
    byChapter,
  };
}

/**
 * 다음에 답할 질문. 앞에서부터 아직 비어 있는 첫 질문을 돌려준다.
 * 순서대로 답하는 사람이 대부분이고, 건너뛴 질문은 목록에서 직접 고를 수 있다.
 */
export function nextUnanswered(book: MemoirBook): MemoirQuestion | undefined {
  return QUESTIONS.find((q) => countChars(book.answers[q.id]?.text ?? "") === 0);
}

export type ManuscriptEntry = {
  heading: string;
  body: string;
};

export type ManuscriptChapter = {
  chapter: MemoirChapter;
  entries: ManuscriptEntry[];
  chars: number;
};

/**
 * 답변을 장 순서대로 엮어 원고 형태로 만든다.
 * 답이 없는 질문은 빈 칸을 남기지 않고 그냥 뺀다 — 없는 것을 채우지 않는다(§14-A ②).
 */
export function buildManuscript(book: MemoirBook): ManuscriptChapter[] {
  return CHAPTERS.map((chapter) => {
    const entries: ManuscriptEntry[] = [];

    for (const q of QUESTIONS_BY_CHAPTER[chapter.id] ?? []) {
      const text = book.answers[q.id]?.text?.trim();
      if (text) entries.push({ heading: q.text, body: text });
    }
    for (const note of book.notes) {
      if (note.chapterId === chapter.id && note.text.trim()) {
        entries.push({ heading: note.title || "기록", body: note.text.trim() });
      }
    }

    return {
      chapter,
      entries,
      chars: entries.reduce((sum, e) => sum + countChars(e.body), 0),
    };
  }).filter((c) => c.entries.length > 0);
}

/**
 * 원고를 마크다운으로 내보낸다. 편집자·출판사에 그대로 넘길 수 있는 형태다.
 * 질문은 소제목으로 남긴다 — 나중에 편집 단계에서 지우면 되고, 남겨두면 맥락이 보인다.
 */
export function toMarkdown(book: MemoirBook): string {
  const manuscript = buildManuscript(book);
  const progress = progressOf(book);
  const lines: string[] = [];

  lines.push(`# ${book.title.trim() || "제목 없음"}`);
  if (book.subtitle.trim()) lines.push(`### ${book.subtitle.trim()}`);
  if (book.author.trim()) lines.push(`\n${book.author.trim()} 지음`);
  lines.push(
    `\n> 원고 ${progress.chars.toLocaleString()}자 · 약 ${progress.pages}쪽 (${CHARS_PER_PAGE}자/쪽 환산)`
  );
  lines.push(`> 답변한 질문 ${progress.answered} / ${progress.totalQuestions}`);
  lines.push("");

  let currentPart = "";
  for (const item of manuscript) {
    const part = PARTS.find((p) => p.id === item.chapter.partId);
    if (part && part.id !== currentPart) {
      currentPart = part.id;
      lines.push(`\n---\n`);
      lines.push(`## ${part.label} — ${part.title}`);
    }

    lines.push(`\n### ${item.chapter.title}`);
    lines.push(`*${item.chapter.subtitle}*\n`);

    for (const entry of item.entries) {
      lines.push(`**${entry.heading}**\n`);
      lines.push(`${entry.body}\n`);
    }
  }

  return lines.join("\n");
}
