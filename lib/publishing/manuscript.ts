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
 * 대표 원고 「유리 벽돌을 쌓다」 PDF에서 실제로 나온 형태를 그대로 받는다 —
 * `제1장`, `제3 장`(숫자와 '장' 사이 공백), `PART ONE`, `프롤로그`.
 * PDF에서 글자를 뽑으면 공백이 불규칙하게 끼므로 패턴을 느슨하게 잡는다.
 */
const PART_RE = /^(?:#{1,3}\s*)?(PART\s+[A-Z0-9]+|제\s*\d+\s*부)\b.*$/i;
const CHAPTER_RE = /^(?:#{1,3}\s*)?제?\s*\d+\s*장\s*$/;
/** 마크다운 제목으로 적힌 장 (자서전 코너 내보내기 형식). */
const MD_CHAPTER_RE = /^#{3}\s+(.+)$/;
const FRONT_WORDS = ["저자의 말", "머리말", "서문", "들어가며", "프롤로그"];
const BACK_WORDS = ["에필로그", "맺음말", "나가며", "부록", "감사의 말"];

function matchWord(line: string, words: string[]): string | null {
  const bare = line.replace(/^#{1,3}\s*/, "").trim();
  for (const w of words) {
    // "프롤로그: 선 하나가 세계를 바꾼다" 처럼 뒤에 부제가 붙는 경우도 받는다.
    if (bare === w || bare.startsWith(`${w}:`) || bare.startsWith(`${w} —`)) return bare;
  }
  return null;
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
  const units: ManuscriptUnit[] = [];
  let currentPart = "";
  let pending: Pending | null = null;
  let chapterNo = 0;
  let frontNo = 0;
  let backNo = 0;
  /** 장 제목 바로 다음 줄은 부제일 수 있다. 그 줄을 기다리는 중인지. */
  let awaitingSubtitle = false;

  const flush = () => {
    if (!pending) return;
    const body = pending.lines.join("\n").trim();
    const id =
      pending.kind === "chapter"
        ? `ch-${++chapterNo}`
        : pending.kind === "front"
          ? `front-${++frontNo}`
          : pending.kind === "back"
            ? `back-${++backNo}`
            : `part-${units.length + 1}`;
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
      flush();
      currentPart = line.replace(/^#{1,3}\s*/, "").trim();
      awaitingSubtitle = false;
      continue;
    }

    if (CHAPTER_RE.test(line)) {
      open("chapter", line.replace(/^#{1,3}\s*/, "").trim(), true);
      continue;
    }

    const mdChapter = line.match(MD_CHAPTER_RE);
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
