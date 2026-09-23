/**
 * 책 집필 도구의 단계별 프롬프트.
 *
 * 흐름은 The Nerdy Novelist(Jason Hamilton)의 "프랙탈 방식"을 따른다:
 *   아이디어 → 기획서(스토리 바이블) → 목차 → 장면 분해 → 초안 → 문체 이식
 * 여기에 목차 없이 한 장면씩 이어 쓰는 "즉흥 집필(Discovery Writing)"을 더했다.
 *
 * 화면(「Claude용 프롬프트 복사」)과 서버(/api/bookwriter)가 이 파일 하나를 같이 쓴다 —
 * 복사한 프롬프트와 실제로 AI에 보낸 프롬프트가 달라지면 안 되기 때문이다(§14-A ⑥).
 *
 * ⚠️ 비소설은 AI가 수치·통계·인용을 지어내는 순간 책의 신뢰가 무너진다(§0-2 원칙 2).
 *    그래서 「근거 자료」 칸에 넣은 것만 쓰게 하고, 없으면 [확인 필요]로 비워두게 한다.
 */

export const BOOK_KINDS = ["fiction", "nonfiction"] as const;
export type BookKind = (typeof BOOK_KINDS)[number];

export const BOOK_STEPS = ["ideas", "bible", "outline", "beats", "draft", "scene"] as const;
export type BookStep = (typeof BOOK_STEPS)[number];

/** 한 칸에 넣을 수 있는 최대 글자 수. 서버 검증과 화면 안내가 같은 값을 본다. */
export const FIELD_LIMIT = {
  short: 300,
  medium: 3000,
  long: 12000,
} as const;

export interface BookBasics {
  kind: BookKind;
  genre: string;
  /** 작가가 처음 가진 생각 한 줄. 비어 있어도 된다. */
  premise: string;
  /** 소설: 1인칭/3인칭 등. 비소설은 쓰지 않는다. */
  pov: string;
  /** 소설: 과거형/현재형. 비소설은 쓰지 않는다. */
  tense: string;
}

export interface PromptInput extends BookBasics {
  step: BookStep;
  /** bible: 고른 아이디어 */
  idea?: string;
  /** 기획서(스토리 바이블) — outline 이후 모든 단계의 기준 */
  bible?: string;
  /** 비소설 근거 자료(Perplexity 등으로 모은 수치·출처) */
  sources?: string;
  chapterCount?: number;
  /** beats·draft: 전체 목차(맥락) */
  outline?: string;
  chapterTitle?: string;
  chapterSummary?: string;
  /** draft: 장면 분해 결과 */
  beats?: string;
  /** draft·scene: 작가가 직접 고친 문체 견본 */
  styleSample?: string;
  /** draft·scene: 바로 앞 내용의 끝부분 — 흐름을 이어받는다 */
  previous?: string;
  /** scene: 이번 장면에서 일어날 일 1~2문장 */
  beat?: string;
}

const KIND_LABEL: Record<BookKind, string> = { fiction: "소설", nonfiction: "비소설(자기계발·에세이·전문서)" };

/** 앞 내용은 끝부분만 넘긴다. 전부 넘기면 길기만 하고 흐름을 잇는 데는 마지막 몇 문단이면 충분하다. */
export const PREVIOUS_TAIL_CHARS = 1500;

export function tail(text: string, chars = PREVIOUS_TAIL_CHARS): string {
  const t = text.trim();
  return t.length > chars ? `…${t.slice(-chars)}` : t;
}

function block(label: string, value?: string): string {
  const v = value?.trim();
  return v ? `\n[${label}]\n${v}\n` : "";
}

function basicsBlock(b: BookBasics): string {
  const lines = [`- 종류: ${KIND_LABEL[b.kind]}`];
  if (b.genre.trim()) lines.push(`- 장르/분야: ${b.genre.trim()}`);
  if (b.kind === "fiction") {
    if (b.pov.trim()) lines.push(`- 시점: ${b.pov.trim()}`);
    if (b.tense.trim()) lines.push(`- 시제: ${b.tense.trim()}`);
  }
  return `[책 기본 정보]\n${lines.join("\n")}\n`;
}

/** 비소설의 사실 규칙. 초안·장면을 쓰는 모든 단계에 똑같이 붙는다. */
function factRule(input: PromptInput): string {
  if (input.kind !== "nonfiction") return "";
  return `
사실 규칙(가장 중요):
- 수치·통계·연구·인용·실명 사례는 [근거 자료]에 있는 것만 쓰세요. 출처도 함께 적으세요.
- 근거 자료에 없는데 필요한 곳은 지어내지 말고 [확인 필요: 무엇을 찾아야 하는지]라고 표시하세요.
- 저자의 경험담은 [기획서]에 적힌 것만 쓰세요. 없는 일화를 만들지 마세요.
`;
}

function styleRule(sample?: string): string {
  if (!sample?.trim()) return "";
  return `
[문체 견본 — 작가가 직접 고친 글]
${sample.trim()}

위 견본의 어조, 문장 길이, 대사 톤, 묘사 밀도를 그대로 따라 쓰세요. 견본의 내용은 반복하지 마세요.
`;
}

export function buildPrompt(input: PromptInput): string {
  const head = basicsBlock(input);

  switch (input.step) {
    case "ideas":
      return `당신은 출판 기획자입니다. 아래 조건으로 책 아이디어 5가지를 제안해 주세요.

${head}${block("작가의 처음 생각", input.premise)}
각 아이디어는 다음 형식으로 쓰세요.
1. 가제
2. 한 줄 요약
3. 핵심 갈등${input.kind === "nonfiction" ? "(독자가 가진 문제)" : ""}
4. 이 책만의 차별점
5. 예상 독자

과장된 수식어 없이 구체적으로 쓰세요.`;

    case "bible":
      return `당신은 출판 기획자입니다. 아래 아이디어를 책 한 권의 기획서로 넓혀 주세요.
이 기획서는 이후 모든 챕터를 쓸 때 기준 문서(스토리 바이블)로 씁니다.

${head}${block("고른 아이디어", input.idea)}
${
  input.kind === "fiction"
    ? `다음을 정리하세요.
1. 주요 인물 3명 — 이름, 나이, 겉모습, 원하는 것, 두려워하는 것, 말버릇
2. 핵심 배경·설정 3가지 — 장소, 시대, 규칙
3. 중심 갈등과 절정(클라이맥스)
4. 결말 방향
5. 작품 전체의 분위기와 주제`
    : `다음을 정리하세요.
1. 핵심 메시지 한 문장
2. 대상 독자와 그 독자가 겪는 문제
3. 저자가 이 책을 쓸 자격 — 작가가 알려준 경험만 쓰고, 모르면 [작가가 채울 것]으로 비워두세요
4. 각 장의 공통 구조: 개념 설명 → 사례·경험담 → 실행 가이드
5. 독자가 책을 덮은 뒤 달라져야 할 것 3가지`
}`;

    case "outline":
      return `당신은 출판 편집자입니다. 아래 기획서를 바탕으로 전체 목차를 ${input.chapterCount ?? 12}개 장으로 만들어 주세요.

${head}${block("기획서", input.bible)}${block("근거 자료", input.sources)}
각 장의 요약은 모호하지 않게, 고스트라이터에게 넘겨 바로 초안을 쓸 수 있을 만큼 구체적인 사건과 행동${
        input.kind === "nonfiction" ? "(다룰 개념·사례·실행 과제)" : ""
      }을 담아 3~5문장으로 쓰세요.

반드시 아래 JSON 배열 하나만 출력하세요. 다른 말은 쓰지 마세요.
[{"title": "장 제목", "summary": "구체적인 요약"}]`;

    case "beats":
      return `당신은 출판 편집자입니다. 아래 장을 12~15단계의 세부 장면으로 나눠 주세요.

${head}${block("기획서", input.bible)}${block("전체 목차", input.outline)}
[이번 장]
제목: ${input.chapterTitle ?? ""}
요약: ${input.chapterSummary ?? ""}

한 줄에 한 단계씩, 번호를 붙여 "누가 무엇을 한다" 수준으로 구체적으로 쓰세요.
${input.kind === "nonfiction" ? "개념 설명 → 사례·경험담 → 실행 가이드 순서가 드러나게 나누세요." : "인물의 행동과 감정 변화가 드러나게 나누세요."}
단계 목록만 출력하세요.`;

    case "draft":
      return `당신은 고스트라이터입니다. 아래 장면 분해를 따라 이번 장의 본문 초안을 쓰세요.

${head}${block("기획서", input.bible)}${block("근거 자료", input.sources)}
[이번 장]
제목: ${input.chapterTitle ?? ""}
요약: ${input.chapterSummary ?? ""}
${block("장면 분해", input.beats)}${block("바로 앞 내용(끝부분)", input.previous)}${styleRule(input.styleSample)}${factRule(input)}
쓰는 방법:
- 장면 분해의 순서를 하나도 빠뜨리지 말고 따르세요.
- 요약하듯 쓰지 말고, 장면을 보여주듯 쓰세요.
- 앞 내용이 있으면 자연스럽게 이어지게 쓰세요.
- 제목·머리말·설명 없이 본문만 출력하세요.`;

    case "scene":
      return `당신은 소설가입니다. 아래 한 장면을 400~800자 분량의 생생한 본문으로 쓰세요.

${head}${block("기획서", input.bible)}${block("바로 앞 내용(끝부분)", input.previous)}
[이번 장면에서 일어날 일]
${input.beat ?? ""}
${styleRule(input.styleSample)}${factRule(input)}
쓰는 방법:
- 이번 장면에 적힌 일만 쓰세요. 그 뒤 일을 앞질러 쓰지 마세요.
- 앞 내용이 있으면 자연스럽게 이어지게 쓰세요.
- 본문만 출력하세요.`;
  }
}

export interface OutlineChapter {
  title: string;
  summary: string;
}

/**
 * 목차 단계의 AI 응답을 읽는다. 모델이 ```json 울타리나 앞뒤 말을 붙여도 배열만 찾아낸다.
 * 읽을 수 없으면 빈 배열 — 화면에서 "다시 눌러 주세요"로 안내한다.
 */
export function parseOutline(text: string): OutlineChapter[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end <= start) return [];
  try {
    const raw = JSON.parse(text.slice(start, end + 1)) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((c) => ({
        title: typeof c?.title === "string" ? c.title.trim() : "",
        summary: typeof c?.summary === "string" ? c.summary.trim() : "",
      }))
      .filter((c) => c.title || c.summary);
  } catch {
    return [];
  }
}

/** 목차를 사람이 읽는 글로 — beats·draft 단계에 맥락으로 넘긴다. */
export function outlineText(chapters: OutlineChapter[]): string {
  return chapters.map((c, i) => `${i + 1}장. ${c.title}\n${c.summary}`).join("\n\n");
}
