import { describe, expect, it } from "vitest";
import { QUESTIONS, CHAPTERS, QUESTIONS_BY_CHAPTER } from "@/lib/memoir/questions";
import {
  CHARS_PER_PAGE,
  buildManuscript,
  countChars,
  emptyBook,
  nextUnanswered,
  progressOf,
  toMarkdown,
  toPages,
  type MemoirBook,
} from "@/lib/memoir/manuscript";

function bookWith(answers: Record<string, string>): MemoirBook {
  const book = emptyBook();
  for (const [questionId, text] of Object.entries(answers)) {
    book.answers[questionId] = { questionId, text, updatedAt: "2026-08-21T00:00:00.000Z" };
  }
  return book;
}

describe("질문 데이터", () => {
  it("질문 id가 중복되지 않는다", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 질문이 실재하는 장에 속한다", () => {
    const chapterIds = new Set(CHAPTERS.map((c) => c.id));
    for (const q of QUESTIONS) expect(chapterIds.has(q.chapterId)).toBe(true);
  });

  it("빈 장이 없다", () => {
    for (const c of CHAPTERS) expect(QUESTIONS_BY_CHAPTER[c.id].length).toBeGreaterThan(0);
  });
});

describe("countChars", () => {
  it("공백을 한 칸으로 눌러 센다", () => {
    expect(countChars("가  나\n\n다")).toBe(5);
  });

  it("앞뒤 공백만 있으면 0이다", () => {
    expect(countChars("   \n  ")).toBe(0);
  });
});

describe("toPages", () => {
  it("한 쪽 분량이면 1쪽이다", () => {
    expect(toPages(CHARS_PER_PAGE)).toBe(1);
  });

  it("빈 원고는 0쪽이다", () => {
    expect(toPages(0)).toBe(0);
  });
});

describe("progressOf", () => {
  it("빈 책은 0이다", () => {
    const p = progressOf(emptyBook());
    expect(p.answered).toBe(0);
    expect(p.chars).toBe(0);
    expect(p.percent).toBe(0);
  });

  it("답변한 질문만 센다 — 공백만 적은 답은 세지 않는다", () => {
    const p = progressOf(bookWith({ "birth-1": "가나다라마", "birth-2": "   " }));
    expect(p.answered).toBe(1);
    expect(p.chars).toBe(5);
  });

  it("장별 합계가 전체 합계와 같다", () => {
    const p = progressOf(bookWith({ "birth-1": "가나다", "family-1": "라마바사" }));
    expect(p.byChapter.reduce((s, c) => s + c.chars, 0)).toBe(p.chars);
  });

  it("목표를 넘어도 100을 넘지 않는다", () => {
    const p = progressOf(bookWith({ "birth-1": "가".repeat(300 * CHARS_PER_PAGE + 1000) }));
    expect(p.percent).toBe(100);
  });
});

describe("nextUnanswered", () => {
  it("빈 책에서는 첫 질문을 준다", () => {
    expect(nextUnanswered(emptyBook())?.id).toBe(QUESTIONS[0].id);
  });

  it("답한 질문은 건너뛴다", () => {
    expect(nextUnanswered(bookWith({ [QUESTIONS[0].id]: "답" }))?.id).toBe(QUESTIONS[1].id);
  });

  it("전부 답하면 undefined", () => {
    const all = Object.fromEntries(QUESTIONS.map((q) => [q.id, "답"]));
    expect(nextUnanswered(bookWith(all))).toBeUndefined();
  });
});

describe("buildManuscript / toMarkdown", () => {
  it("답이 없는 장은 원고에 넣지 않는다", () => {
    const m = buildManuscript(bookWith({ "birth-1": "첫 문장" }));
    expect(m).toHaveLength(1);
    expect(m[0].chapter.id).toBe("birth");
  });

  it("빈 책의 마크다운에도 제목 자리는 남는다", () => {
    expect(toMarkdown(emptyBook())).toContain("제목 없음");
  });

  it("답변 본문이 마크다운에 그대로 들어간다", () => {
    const md = toMarkdown(bookWith({ "birth-1": "1970년 겨울에 태어났다." }));
    expect(md).toContain("1970년 겨울에 태어났다.");
  });

  it("메모도 해당 장에 들어간다", () => {
    const book = emptyBook();
    book.notes.push({
      id: "n1",
      chapterId: "birth",
      title: "기존 원고",
      text: "예전에 써둔 글",
      updatedAt: "2026-08-21T00:00:00.000Z",
    });
    expect(toMarkdown(book)).toContain("예전에 써둔 글");
  });
});
