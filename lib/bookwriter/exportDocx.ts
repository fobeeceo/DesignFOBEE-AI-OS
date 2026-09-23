import { countChars, toPages, writtenChapters, type BookProject } from "@/lib/bookwriter/project";
import { CHARS_PER_PAGE } from "@/lib/memoir/pageSize";

/**
 * 출판사 투고용 Word(.docx) 원고.
 * 표지(제목·부제·지은이) → 목차 → 장마다 새 쪽. 출판사는 대개 Word 원고를 받는다.
 *
 * ⚠️ 원고를 그대로 옮기기만 한다. 요약·보완하지 않는다(§14-A ②).
 *    .md 내려받기와 같은 writtenChapters()를 써서 담기는 글이 같게 한다(§14-A ⑥).
 * ⚠️ docx 패키지는 무겁다. 버튼을 누를 때만 불러온다.
 */
const FONT = "맑은 고딕";

/** 파일명에 쓸 수 없는 문자와 제어문자를 걷어낸다. 제목이 없으면 "책"으로 둔다 — 지어내지 않는다. */
export function docxFileName(title: string, date = new Date()): string {
  const safe = title
    .replace(/[\\/:*?"<>|]/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 60)
    .trim();
  const d = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `${safe || "책"}_투고원고_${d}.docx`;
}

export async function buildBookDocx(p: BookProject): Promise<Blob> {
  const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");

  type Opts = {
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    bold?: boolean;
    size?: number;
    color?: string;
    center?: boolean;
    before?: number;
    after?: number;
    pageBreakBefore?: boolean;
  };
  const para = (text: string, o: Opts = {}) =>
    new Paragraph({
      heading: o.heading,
      alignment: o.center ? AlignmentType.CENTER : undefined,
      pageBreakBefore: o.pageBreakBefore,
      spacing: { before: o.before ?? 0, after: o.after ?? 160, line: 360 },
      children: [new TextRun({ text, bold: o.bold, size: o.size, color: o.color, font: FONT })],
    });

  const chapters = writtenChapters(p);
  const chars = chapters.reduce((sum, c) => sum + countChars(c.body), 0);
  const children = [
    para(p.title.trim() || "제목 없음", { heading: HeadingLevel.TITLE, center: true, size: 56, bold: true, before: 2400, after: 240 }),
  ];
  if (p.subtitle.trim()) children.push(para(p.subtitle.trim(), { center: true, size: 26, color: "555555", after: 720 }));
  if (p.author.trim()) children.push(para(`${p.author.trim()} 지음`, { center: true, size: 24, after: 480 }));
  children.push(
    para(`원고 ${chars.toLocaleString()}자 · 약 ${toPages(chars)}쪽(한 쪽 ${CHARS_PER_PAGE}자 환산)`, { center: true, size: 18, color: "888888" })
  );

  children.push(para("차례", { heading: HeadingLevel.HEADING_1, size: 32, bold: true, pageBreakBefore: true, after: 360 }));
  p.chapters.forEach((c, i) => children.push(para(`${i + 1}장. ${c.title.trim()}`, { size: 22, after: 120 })));

  for (const c of chapters) {
    children.push(
      para(`${c.no}장. ${c.title}`, { heading: HeadingLevel.HEADING_1, size: 32, bold: true, pageBreakBefore: true, before: 1200, after: 480 })
    );
    for (const line of c.body.split(/\n+/).map((l) => l.trim()).filter(Boolean)) {
      children.push(para(line, { size: 22 }));
    }
  }

  const doc = new Document({
    creator: p.author.trim() || "저자",
    title: p.title.trim() || "원고",
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{ properties: {}, children }],
  });
  return Packer.toBlob(doc);
}
