import { PARTS } from "@/lib/memoir/questions";
import {
  CHARS_PER_PAGE,
  buildManuscript,
  progressOf,
  type MemoirBook,
} from "@/lib/memoir/manuscript";

/**
 * 원고를 Word(.docx) 문서로 만든다.
 *
 * ⚠️ 원문을 그대로 옮기기만 한다. 내용을 요약·보완·정렬하지 않는다(§14-A ②).
 *    Markdown·JSON 내보내기와 같은 buildManuscript 결과를 쓴다 — 형식만 다르고
 *    담기는 글은 완전히 같아야 하기 때문이다(§14-A ⑥).
 *
 * ⚠️ docx 패키지는 무겁다. 내보내기를 누를 때만 동적으로 불러와
 *    자서전을 쓰는 동안에는 내려받지 않게 한다.
 */

/** 본인 검수 안내. 문서와 화면 양쪽에서 같은 문장을 쓴다. */
export const REVIEW_NOTICE = "완성된 글은 반드시 본인이 읽고 사실을 확인해 주세요.";

/** 한글이 있는 환경에서 가장 무난한 기본 글꼴. 없으면 Word가 알아서 대체한다. */
const FONT = "맑은 고딕";

/** YYYY-MM-DD. 파일명과 문서 표지에 같은 값을 쓴다. */
export function today(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

/**
 * 파일명을 만든다. 예: `유리 벽돌을 쌓다_원고_2026-08-22.docx`
 *
 * 윈도우·맥에서 쓸 수 없는 문자와 제어문자를 걷어낸다.
 * 제목이 비어 있으면 "자서전"으로 둔다 — 지어내지 않는다.
 */
export function manuscriptFileName(title: string, ext: "docx" | "pdf", date = new Date()): string {
  const safe = title
    .replace(/[\\/:*?"<>|]/g, "")
    // 제어문자(널·탭·줄바꿈 등)를 공백으로 바꾼다. 파일명에 들어가면 저장이 실패한다.
    // ⚠️ 빈 문자열로 지우면 "제목\n둘째"가 "제목둘째"로 붙는다 — 줄바꿈은 낱말 경계다.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 60)
    .trim();
  return `${safe || "자서전"}_원고_${today(date)}.${ext}`;
}

/** 빈 줄로 나뉜 문단을 그대로 살린다. 구술 원고는 줄바꿈이 곧 호흡이다. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** 내보낼 원고가 있는지. 없으면 버튼을 눌러도 빈 문서만 나온다. */
export function hasContent(book: MemoirBook): boolean {
  return buildManuscript(book).length > 0;
}

/** 표지에 넣는 한 줄 요약. 화면·Word·인쇄가 같은 문장을 쓰도록 한 곳에서 만든다. */
export function summaryLine(book: MemoirBook): string {
  const progress = progressOf(book);
  return `원고 ${progress.chars.toLocaleString()}자 · 약 ${progress.pages}쪽 (한 쪽 ${CHARS_PER_PAGE}자 환산) · 답변한 질문 ${progress.answered} / ${progress.totalQuestions}`;
}

export async function buildDocxBlob(book: MemoirBook, date = new Date()): Promise<Blob> {
  const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");

  const manuscript = buildManuscript(book);

  type ParaOptions = {
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    bold?: boolean;
    italics?: boolean;
    size?: number;
    color?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    before?: number;
    after?: number;
    pageBreakBefore?: boolean;
  };

  const p = (text: string, opts: ParaOptions = {}) =>
    new Paragraph({
      heading: opts.heading,
      alignment: opts.align,
      pageBreakBefore: opts.pageBreakBefore,
      spacing: { before: opts.before ?? 0, after: opts.after ?? 120, line: 340 },
      children: [
        new TextRun({
          text,
          bold: opts.bold,
          italics: opts.italics,
          size: opts.size,
          color: opts.color,
          font: FONT,
        }),
      ],
    });

  const children: ReturnType<typeof p>[] = [];

  // ── 표지 ─────────────────────────────────────────────
  children.push(
    p(book.title.trim() || "제목 없음", {
      heading: HeadingLevel.TITLE,
      align: AlignmentType.CENTER,
      size: 56,
      bold: true,
      before: 2400,
      after: 240,
    })
  );
  if (book.subtitle.trim()) {
    children.push(
      p(book.subtitle.trim(), {
        align: AlignmentType.CENTER,
        size: 26,
        color: "555555",
        after: 720,
      })
    );
  }
  if (book.author.trim()) {
    children.push(
      p(`${book.author.trim()} 지음`, { align: AlignmentType.CENTER, size: 24, after: 240 })
    );
  }
  children.push(
    p(`${today(date)} 만듦`, { align: AlignmentType.CENTER, size: 20, color: "888888", after: 720 })
  );
  children.push(
    p(summaryLine(book), { align: AlignmentType.CENTER, size: 18, color: "888888", after: 240 })
  );
  children.push(
    p(REVIEW_NOTICE, { align: AlignmentType.CENTER, size: 20, bold: true, color: "8C4A32" })
  );

  // ── 본문 ─────────────────────────────────────────────
  // 부(PART)마다 새 쪽에서 시작한다. 장은 이어서 흐른다 — 답이 한두 개뿐인 장이
  // 많은 초반에 장마다 쪽을 넘기면 빈 쪽만 잔뜩 생긴다.
  let currentPart = "";

  for (const item of manuscript) {
    const part = PARTS.find((x) => x.id === item.chapter.partId);
    if (part && part.id !== currentPart) {
      currentPart = part.id;
      children.push(
        p(`${part.label} — ${part.title}`, {
          heading: HeadingLevel.HEADING_1,
          align: AlignmentType.CENTER,
          size: 36,
          bold: true,
          pageBreakBefore: true,
          before: 1200,
          after: 480,
        })
      );
    }

    children.push(
      p(item.chapter.title, {
        heading: HeadingLevel.HEADING_2,
        size: 30,
        bold: true,
        before: 480,
        after: 80,
      })
    );
    children.push(
      p(item.chapter.subtitle, { size: 20, italics: true, color: "888888", after: 320 })
    );

    for (const entry of item.entries) {
      children.push(
        p(entry.heading, { size: 22, bold: true, color: "8C4A32", before: 320, after: 120 })
      );
      for (const line of splitParagraphs(entry.body)) {
        children.push(p(line, { size: 22, after: 160 }));
      }
    }
  }

  const doc = new Document({
    creator: book.author.trim() || "자서전",
    title: book.title.trim() || "자서전 원고",
    description: REVIEW_NOTICE,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{ properties: {}, children }],
  });

  return Packer.toBlob(doc);
}
