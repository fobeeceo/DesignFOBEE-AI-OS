#!/usr/bin/env node
/**
 * Word(.docx) 원고를 마크다운으로 바꾼다.
 *
 *   npm run publishing -- docx <파일.docx> [내보낼파일.md]
 *
 * 왜 필요한가:
 *  대표 원고는 Word로 작성·편집된다. 분해기(splitManuscript)는 글줄을 보고
 *  장 경계를 찾는데, Word에서 글자만 뽑으면 **제목인지 본문인지 구분이 사라진다.**
 *  특히 '목차(가안)'에 적힌 "저자의 말: …"과 실제 본문의 "저자의 말: …"이
 *  똑같은 글줄이 되어, 목차 항목이 장으로 잡히고 원고가 두 번 쪼개진다.
 *
 *  그래서 Word의 단락 스타일을 마크다운 기호로 옮긴다:
 *    제목1 → `# `     부(PART)·저자의 말·프롤로그 같은 큰 구분
 *    제목2 → `## `    장
 *    제목3 → `### `   장 안의 소제목
 *    목록  → `- `     목차 항목 — 제목으로 잡히지 않게 한다
 *
 * ⚠️ 글자는 하나도 바꾸지 않는다. 앞에 기호만 붙인다.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { inflateRawSync } from "node:zlib";

/** Word 단락 스타일 id → 마크다운 접두사. */
const STYLE_PREFIX = new Map([
  ["Heading1", "# "],
  ["1", "# "],
  ["Heading2", "## "],
  ["21", "## "],
  ["2", "## "],
  ["Heading3", "### "],
  ["31", "### "],
  ["3", "### "],
  ["ListParagraph", "- "],
  ["a0", "- "],
]);

/** XML 엔티티를 되돌린다. */
function unescapeXml(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

/**
 * .docx(ZIP) 안에서 word/document.xml을 꺼낸다.
 * 외부 패키지 없이 Node 기본 모듈만 쓴다.
 */
function readDocumentXml(buf) {
  // ZIP local file header들을 훑어 word/document.xml을 찾는다.
  for (let i = 0; i < buf.length - 4; i++) {
    if (buf.readUInt32LE(i) !== 0x04034b50) continue;
    const method = buf.readUInt16LE(i + 8);
    const compSize = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const name = buf.toString("utf8", i + 30, i + 30 + nameLen);
    if (name !== "word/document.xml") continue;

    const start = i + 30 + nameLen + extraLen;
    const data = buf.subarray(start, start + compSize);
    if (compSize === 0) break; // 크기가 헤더에 없는 경우 — 아래에서 오류를 낸다
    // method 8 = deflate(raw). ZIP은 zlib 머리말이 없어 inflateRaw를 쓴다.
    return method === 0 ? data.toString("utf8") : inflateRawSync(data).toString("utf8");
  }
  throw new Error("word/document.xml을 찾지 못했습니다. .docx 파일이 맞는지 확인해 주세요.");
}

/** 단락 하나에서 글자와 스타일을 뽑는다. */
function parseParagraph(xml) {
  const styleMatch = xml.match(/<w:pStyle\s+w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : "";

  let text = "";
  // <w:t>글자</w:t>, <w:tab/>, <w:br/> 를 순서대로 모은다.
  const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    if (m[1] !== undefined) text += unescapeXml(m[1]);
    else if (m[0].startsWith("<w:tab")) text += "\t";
    else text += "\n";
  }
  return { style, text };
}

export function docxToMarkdown(buf) {
  const xml = readDocumentXml(buf);
  const out = [];
  const paraRe = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>|<w:p(?:\s[^>]*)?\/>/g;
  let m;
  let blank = false;

  while ((m = paraRe.exec(xml)) !== null) {
    const { style, text } = parseParagraph(m[1] ?? "");
    const trimmed = text.trim();

    if (!trimmed) {
      if (!blank && out.length) out.push("");
      blank = true;
      continue;
    }
    blank = false;

    const prefix = STYLE_PREFIX.get(style) ?? "";
    if (prefix && out.length && out[out.length - 1] !== "") out.push("");
    out.push(prefix + trimmed);
    if (prefix) out.push("");
    blank = Boolean(prefix);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function convertFile(input, output) {
  const inPath = resolve(process.cwd(), input);
  const md = docxToMarkdown(readFileSync(inPath));
  const outPath = output
    ? resolve(process.cwd(), output)
    : inPath.replace(/\.docx$/i, "") + ".md";
  writeFileSync(outPath, md);
  const chars = md.replace(/\s+/g, " ").trim().length;
  return { outPath, chars, lines: md.split("\n").length, name: basename(inPath) };
}
