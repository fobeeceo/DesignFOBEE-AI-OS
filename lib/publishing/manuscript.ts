/**
 * 원고 분해 — 자서전 원고를 장(章) 단위로 쪼갠다.
 *
 * 왜 먼저 쪼개는가:
 *  1. 원고 전체를 한 번에 AI에 넘기면 긴 원고에서 뒤쪽이 통째로 무시된다.
 *     장 단위로 보내야 모든 대목이 같은 주의를 받는다.
 *  2. 어느 장을 손봤는지 추적할 수 있다. 원고 전체를 통으로 바꾸면 무엇이
 *     달라졌는지 아무도 모른다.
 *  3. 대표가 한 장씩 승인할 수 있다.
 *
 * ⚠️ 이 모듈은 AI를 쓰지 않는다. 글자를 그대로 옮길 뿐 내용을 바꾸지 않는다.
 *    GEMINI_API_KEY 없이도 동작하고, 그래서 테스트로 전부 검증할 수 있다.
 */

export type UnitKind = "front" | "part" | "chapter" | "back";

export type ManuscriptUnit = {
  /** `ch-3`, `front-1` 같은 안정적인 식별자. 작업 파일 이름에 쓴다. */
  id: string;
  kind: UnitKind;
  /** 원고에 적힌 그대로의 제목 줄. */
  heading: string;
  /** 제목 아래 부제가 따로 있으면 여기. 없으면 빈 문자열. */
  subtitle: string;
  /** 이 장이 속한 부(PART). 부 구분이 없는 원고면 빈 문자열. */
  part: string;
  body: string;
  chars: number;
};

/**
 * 장 제목 패턴.
 *
 * 원고마다 생김새가 다르다. 대표 원고에서 실제로 나온 세 가지를 모두 받는다:
 *   `제1장`           — 제목이 다음 줄에 있다 (2026-08 PDF)
 *   `제3 장 거친 건축 현장에서의 고뇌` — 제목이 같은 줄에 붙어 있다 (2026-11 docx)
 *   `제20장  하나님 앞에서…`          — 숫자와 '장' 사이에 공백이 없고 뒤에 공백 둘
 * PDF·Word에서 글자를 뽑으면 공백이 불규칙하게 끼므로 패턴을 느슨하게 잡는다.
 */
const PART_RE = /^(?:#{1,6}\s*)?(PART\s+[A-Z0-9]+|제\s*\d+\s*부)\b.*$/i;
const CHAPTER_RE = /^(?:#{1,6}\s*)?제\s*\d+\s*장(?:\s+(.*))?$/;
/** 마크다운 제목으로 적힌 장 (자서전 코너 내보내기 형식). */
const MD_CHAPTER_RE = /^#{3}\s+(.+)$/;
/**
 * 장 제목 줄의 최대 길이.
 *
 * "제3 장 이야기를 꺼낸 것은 그해 겨울이었고…" 같은 본문 문장이 장 제목으로
 * 잘못 잡히는 것을 막는다. 장 제목은 짧고 본문 문장은 길다.
 */
const MAX_HEADING_CHARS = 60;
const FRONT_WORDS = ["저자의 말", "머리말", "서문", "들어가며", "프롤로그"];
const BACK_WORDS = ["에필로그", "맺음말", "나가며", "부록", "감사의 말"];

function matchWord(line: string, words: string[]): string | null {
  // 제목 줄만 본다. 본문 한가운데의 "부록 에 실린 자료는…" 같은 문장이
  // 제목으로 잡히지 않게 길이로 거른다.
  if (line.length > MAX_HEADING_CHARS) return null;
  const bare = line.replace(/^#{1,6}\s*/, "").trim();

  for (const w of words) {
    if (bare === w || bare.startsWith(`${w}:`)) return bare;
    // "부록 자료(편집 검토용)" 처럼 뒤에 말이 더 붙는 제목도 받는다.
    // 다만 문장부호로 끝나면 본문이다 — 제목은 마침표로 끝나지 않는다.
    if (bare.startsWith(`${w} `) && !/[.。?!]$/.test(bare)) return bare;
  }
  return null;
}

function isChapterLine(line: string): RegExpMatchArray | null {
  if (line.length > MAX_HEADING_CHARS) return null;
  return line.match(CHAPTER_RE);
}

type Pending = {
  kind: UnitKind;
  heading: string;
  subtitle: string;
  part: string;
  lines: string[];
};

/**
 * 원고 텍스트를 단위로 쪼갠다.
 *
 * 제목을 하나도 못 찾으면 원고 전체를 단위 하나로 돌려준다 — 빈 결과를 주면
 * 뒤 단계가 조용히 아무 일도 안 한 채 성공한 것처럼 보이기 때문이다(§0-2 원칙 7).
 */
export function splitManuscript(text: string): ManuscriptUnit[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  /**
   * `제N장` 표시가 하나라도 있으면 그것만 장 경계로 쓴다.
   *
   * Word 원고는 장 안의 소제목을 Heading3(`###`)으로 달아둔다 — 1권만 237개다.
   * 그걸 장으로 보면 원고가 237조각으로 부서진다. 명시적인 장 표시가 있는
   * 원고에서는 마크다운 제목을 장 경계로 쓰지 않는다.
   */
  const hasExplicitChapters = lines.some((l) => isChapterLine(l.trim()) !== null);

  const units: ManuscriptUnit[] = [];
  let currentPart = "";
  let pending: Pending | null = null;
  let chapterNo = 0;
  let frontNo = 0;
  let backNo = 0;
  let partNo = 0;
  /** 장 제목 바로 다음 줄은 부제일 수 있다. 그 줄을 기다리는 중인지. */
  let awaitingSubtitle = false;

  const flush = () => {
    if (!pending) return;
    const body = pending.lines.join("\n").trim();
    // 내용이 없는 부(PART) 구분선은 단위로 만들지 않는다 — 장 사이에 빈 조각만 생긴다.
    if (pending.kind === "part" && !body) {
      pending = null;
      return;
    }
    const id =
      pending.kind === "chapter"
        ? `ch-${++chapterNo}`
        : pending.kind === "front"
          ? `front-${++frontNo}`
          : pending.kind === "back"
            ? `back-${++backNo}`
            : `part-${++partNo}`;
    units.push({
      id,
      kind: pending.kind,
      heading: pending.heading,
      subtitle: pending.subtitle,
      part: pending.part,
      body,
      chars: countChars(body),
    });
    pending = null;
  };

  const open = (kind: UnitKind, heading: string, expectSubtitle: boolean) => {
    flush();
    pending = { kind, heading, subtitle: "", part: currentPart, lines: [] };
    awaitingSubtitle = expectSubtitle;
  };

  for (const raw of lines) {
    const line = raw.trim();

    // 부(PART) — 장을 담는 묶음이지 그 자체로 본문은 아니다.
    if (PART_RE.test(line)) {
      // 부(PART) 속표지에는 부제·연도·인용구가 실린다. 구분선으로만 쓰고 넘기면
      // 그 글이 통째로 사라진다 — 대표 원고 1권에서 24줄이 그렇게 빠졌다.
      // 하나의 단위로 담되, 내용이 없으면 flush()에서 버린다.
      flush();
      currentPart = line.replace(/^#{1,6}\s*/, "").trim();
      open("part", currentPart, false);
      continue;
    }

    const chapter = isChapterLine(line);
    if (chapter) {
      const inline = (chapter[1] ?? "").trim();
      const bare = line.replace(/^#{1,6}\s*/, "").trim();
      if (inline) {
        // `제3 장 거친 건축 현장에서의 고뇌` — 제목이 같은 줄에 있다.
        open("chapter", bare.slice(0, bare.length - inline.length).trim(), false);
        pending!.subtitle = inline;
      } else {
        // `제1장` — 제목은 다음 줄에 있다.
        open("chapter", bare, true);
      }
      continue;
    }

    const mdChapter = hasExplicitChapters ? null : line.match(MD_CHAPTER_RE);
    if (mdChapter && !matchWord(line, [...FRONT_WORDS, ...BACK_WORDS])) {
      open("chapter", mdChapter[1].trim(), false);
      continue;
    }

    const front = matchWord(line, FRONT_WORDS);
    if (front) {
      open("front", front, false);
      continue;
    }

    const back = matchWord(line, BACK_WORDS);
    if (back) {
      open("back", back, false);
      continue;
    }

    if (!pending) continue; // 첫 제목 이전의 표지·판권 줄은 버린다.

    // 지역 별칭으로 받는다. flush()·open()이 클로저에서 pending을 바꾸기 때문에
    // 타입 검사기가 이 지점의 pending을 null로만 좁혀 버린다.
    const unit: Pending = pending;

    // 장 번호 바로 다음의 첫 글줄은 장 제목(부제)으로 본다.
    if (awaitingSubtitle) {
      if (line === "") continue;
      unit.subtitle = line;
      awaitingSubtitle = false;
      continue;
    }

    unit.lines.push(raw);
  }
  flush();

  if (units.length === 0 && text.trim()) {
    const body = text.trim();
    return [
      { id: "ch-1", kind: "chapter", heading: "(제목 없음)", subtitle: "", part: "", body, chars: countChars(body) },
    ];
  }

  return units;
}

/** 글자 수. 공백은 한 칸으로 눌러 세고 줄바꿈은 세지 않는다(자서전 코너와 같은 기준). */
export function countChars(text: string): number {
  return text.replace(/\s+/g, " ").trim().length;
}

export type ManuscriptSummary = {
  units: number;
  chapters: number;
  chars: number;
  parts: string[];
  /** 본문이 지나치게 짧은 장 — 빠뜨렸거나 분해가 잘못됐을 수 있다. */
  thin: { id: string; heading: string; chars: number }[];
};

/** 분해 결과를 한눈에 본다. 대표가 "제대로 쪼개졌나"를 바로 판단할 수 있어야 한다. */
export function summarize(units: ManuscriptUnit[], thinThreshold = 200): ManuscriptSummary {
  return {
    units: units.length,
    chapters: units.filter((u) => u.kind === "chapter").length,
    chars: units.reduce((sum, u) => sum + u.chars, 0),
    parts: [...new Set(units.map((u) => u.part).filter(Boolean))],
    thin: units
      .filter((u) => u.chars < thinThreshold)
      .map((u) => ({ id: u.id, heading: u.heading, chars: u.chars })),
  };
}

/** 작업 파일 이름. 장 순서가 파일 이름만으로 유지되도록 번호를 앞에 둔다. */
export function unitFileName(unit: ManuscriptUnit, index: number): string {
  const safe = (unit.subtitle || unit.heading)
    .replace(/[\\/:*?"<>|]/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40)
    .trim();
  return `${String(index + 1).padStart(2, "0")}_${unit.id}_${safe || "무제"}.md`;
}
