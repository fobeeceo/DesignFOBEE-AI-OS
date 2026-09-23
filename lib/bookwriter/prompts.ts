/**
 * 책 집필 도구의 단계별 프롬프트 — 판매용 단행본 기준.
 *
 * 뼈대는 The Nerdy Novelist(Jason Hamilton)의 "프랙탈 방식"이다:
 *   아이디어 → 기획서(스토리 바이블) → 목차 → 장면 분해 → 초안 → 문체 이식
 * 판매용 책은 자서전과 달리 "누가 왜 돈을 내고 사는가"에서 출발해야 하므로 앞뒤를 보탰다:
 *   시장 기획 → … → 제목 → … → 편집자 검토 → 판매 문안(뒷표지·책 소개·투고 기획서)
 * 목차 없이 한 장면씩 이어 쓰는 "즉흥 집필(Discovery Writing)"도 남겨 두었다.
 *
 * 화면(「Claude용 프롬프트 복사」)과 서버(/api/bookwriter)가 이 파일 하나를 같이 쓴다 —
 * 복사한 프롬프트와 실제로 AI에 보낸 프롬프트가 달라지면 안 되기 때문이다(§14-A ⑥).
 *
 * ⚠️ 판매용 책에서 AI가 가장 위험한 곳은 세 군데다(§0-2 원칙 2).
 *    ① 본문의 수치·통계·인용 ② 경쟁 도서의 제목·판매량 ③ 저자 이력·추천사·"베스트셀러" 같은 수식어.
 *    셋 다 작가가 넣은 자료만 쓰게 하고, 없으면 [확인 필요]로 비워두게 한다.
 */

export const BOOK_KINDS = ["fiction", "nonfiction"] as const;
export type BookKind = (typeof BOOK_KINDS)[number];

export const BOOK_STEPS = [
  "market",
  "ideas",
  "bible",
  "titles",
  "outline",
  "beats",
  "draft",
  "continue",
  "review",
  "sales",
  "scene",
] as const;
export type BookStep = (typeof BOOK_STEPS)[number];

/** 한 칸에 넣을 수 있는 최대 글자 수. 서버 검증과 화면 안내가 같은 값을 본다. */
export const FIELD_LIMIT = {
  short: 300,
  medium: 3000,
  long: 12000,
  /** 한 장의 본문. 판매용 단행본 한 장은 1만~2만 자가 흔하다. */
  chapter: 40000,
} as const;

/**
 * 한 번 호출로 쓰게 하는 초안 분량. 모델이 한 번에 안정적으로 내놓는 길이에 맞춘 값이고,
 * 장 목표 분량에 모자라면 「이어 쓰기」로 채운다.
 */
export const DRAFT_CHUNK_CHARS = 5000;

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

/** 판매의 기준이 되는 시장 정보. 작가가 직접 적는다 — AI가 지어낼 수 없는 것들이다. */
export interface MarketInfo {
  /** 누가 읽는가 — 나이·직업·상황까지 */
  reader?: string;
  /** 그 독자가 돈을 내고 해결하고 싶은 문제·욕구 */
  problem?: string;
  /** 서점에서 직접 찾은 경쟁 도서(제목·저자·잘 팔리는 이유·아쉬운 점) */
  comps?: string;
  /** 시장 기획 단계 결과(포지셔닝) — 작가가 고친 것 */
  positioning?: string;
}

export interface PromptInput extends BookBasics, MarketInfo {
  step: BookStep;
  /** bible: 고른 아이디어 */
  idea?: string;
  /** 기획서(스토리 바이블) — outline 이후 모든 단계의 기준 */
  bible?: string;
  /** 비소설 근거 자료(Perplexity 등으로 모은 수치·출처) */
  sources?: string;
  /** 저자 소개 재료 — 사실만. 판매 문안의 저자 소개는 여기서만 가져온다 */
  authorInfo?: string;
  title?: string;
  subtitle?: string;
  chapterCount?: number;
  /** 목표 분량(쪽) */
  targetPages?: number;
  /** 이번 장의 목표 글자 수(목표 분량 ÷ 장 수, 자동 계산) */
  chapterTarget?: number;
  /** beats·draft·sales: 전체 목차(맥락) */
  outline?: string;
  chapterTitle?: string;
  chapterSummary?: string;
  /** draft·continue: 장면 분해 결과 */
  beats?: string;
  /** continue·review: 지금까지 쓴 이 장의 본문 */
  draft?: string;
  /** draft·scene·continue: 작가가 직접 고친 문체 견본 */
  styleSample?: string;
  /** draft·scene: 바로 앞 내용의 끝부분 — 흐름을 이어받는다 */
  previous?: string;
  /** scene: 이번 장면에서 일어날 일 1~2문장 */
  beat?: string;
}

const KIND_LABEL: Record<BookKind, string> = {
  fiction: "소설",
  nonfiction: "비소설(자기계발·경영·에세이·전문서)",
};

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

function basicsBlock(b: PromptInput): string {
  const lines = [`- 종류: ${KIND_LABEL[b.kind]}`];
  if (b.genre.trim()) lines.push(`- 장르/분야: ${b.genre.trim()}`);
  if (b.kind === "fiction") {
    if (b.pov.trim()) lines.push(`- 시점: ${b.pov.trim()}`);
    if (b.tense.trim()) lines.push(`- 시제: ${b.tense.trim()}`);
  }
  if (b.title?.trim()) lines.push(`- 제목: ${b.title.trim()}${b.subtitle?.trim() ? ` — ${b.subtitle.trim()}` : ""}`);
  if (b.targetPages) lines.push(`- 목표 분량: 약 ${b.targetPages}쪽`);
  return `[책 기본 정보]\n${lines.join("\n")}\n`;
}

/** 모든 단계가 공유하는 시장 정보. 이게 빠지면 "좋은 글"은 나와도 "팔리는 책"은 안 나온다. */
function marketBlock(m: MarketInfo): string {
  return (
    block("대상 독자", m.reader) +
    block("독자의 문제·욕구", m.problem) +
    block("경쟁 도서(작가가 직접 조사)", m.comps) +
    block("포지셔닝", m.positioning)
  );
}

/** 판매 문안·기획 단계에 붙는 과장 금지 규칙. */
const HONESTY_RULE = `
정직 규칙(가장 중요):
- 실제 책 제목·저자·판매량·순위를 지어내지 마세요. 경쟁 도서는 [경쟁 도서]에 적힌 것만 언급하세요.
- "베스트셀러", "국내 최초", "유일한", "수십만 독자" 같은 확인할 수 없는 표현을 쓰지 마세요.
- 저자 이력·수상·추천사는 [저자 정보]에 적힌 것만 쓰세요. 없으면 [작가가 채울 것]으로 비워두세요.
`;

/** 비소설의 사실 규칙. 본문을 쓰거나 검토하는 모든 단계에 똑같이 붙는다. */
function factRule(input: PromptInput): string {
  if (input.kind !== "nonfiction") return "";
  return `
사실 규칙(가장 중요):
- 수치·통계·연구·인용·실명 사례는 [근거 자료]에 있는 것만 쓰세요. 출처도 함께 적으세요.
- 근거 자료에 없는데 필요한 곳은 지어내지 말고 [확인 필요: 무엇을 찾아야 하는지]라고 표시하세요.
- 저자의 경험담은 [기획서]·[저자 정보]에 적힌 것만 쓰세요. 없는 일화를 만들지 마세요.
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

/** 판매용 단행본 한 장의 구성 공식. 장면 분해와 초안, 편집자 검토가 같은 기준을 본다. */
function chapterFormula(kind: BookKind): string {
  return kind === "nonfiction"
    ? `판매용 비소설 한 장의 구성:
1) 첫 문단 훅 — 독자가 "내 얘기다"라고 느낄 장면·질문·반전으로 시작 (정의나 배경 설명으로 시작하지 않기)
2) 문제 — 독자가 겪는 어려움을 구체적으로
3) 핵심 개념 — 이 장의 메시지 한 가지
4) 사례·경험담 — 개념을 보여주는 구체적 이야기
5) 실행 도구 — 바로 해볼 수 있는 단계·체크리스트·질문
6) 한 줄 정리 + 다음 장으로 넘어가고 싶게 만드는 연결`
    : `판매용 소설 한 장의 구성:
1) 첫 문단에 긴장이나 궁금증
2) 인물이 무언가를 원하고, 방해를 받는다
3) 장 안에서 상황이 한 번은 바뀐다
4) 장 끝은 다음 장을 넘기게 만드는 질문·위기·반전`;
}

export function buildPrompt(input: PromptInput): string {
  const head = basicsBlock(input);
  const market = marketBlock(input);

  switch (input.step) {
    case "market":
      return `당신은 단행본 출판 기획자입니다. 아래 정보로 이 책의 시장 포지셔닝을 정리해 주세요.

${head}${block("작가의 처음 생각", input.premise)}${block("대상 독자", input.reader)}${block("독자의 문제·욕구", input.problem)}${block("경쟁 도서(작가가 직접 조사)", input.comps)}${block("저자 정보", input.authorInfo)}
다음을 정리하세요.
1. 포지셔닝 한 문장: "[누가] [어떤 상황]일 때 읽는 책. [경쟁 도서]와 달리 [차별점]."
2. 독자에게 하는 약속 3가지 — 책을 덮은 뒤 독자가 얻는 것, 구체적으로
3. 이 저자만 쓸 수 있는 이유 — [저자 정보]에 있는 것만 근거로
4. 경쟁 도서 비교 — [경쟁 도서]에 적힌 책만. 없으면 "경쟁 도서를 먼저 조사하세요"라고 쓰고, 온라인 서점에서 찾아볼 검색어 5개를 제안
5. 서점 검색 키워드 10개 — 독자가 실제로 검색창에 칠 말
6. 이 기획의 약점과 보완 방법 — 솔직하게
${HONESTY_RULE}`;

    case "ideas":
      return `당신은 단행본 출판 기획자입니다. 아래 조건으로 팔릴 수 있는 책 아이디어 5가지를 제안해 주세요.

${head}${block("작가의 처음 생각", input.premise)}${market}
각 아이디어는 다음 형식으로 쓰세요.
1. 가제
2. 한 줄 요약
3. 핵심 갈등${input.kind === "nonfiction" ? "(독자가 가진 문제)" : ""}
4. 이 책만의 차별점
5. 대상 독자와 그 독자가 이 책을 사는 이유

과장된 수식어 없이 구체적으로 쓰세요.${HONESTY_RULE}`;

    case "bible":
      return `당신은 단행본 출판 기획자입니다. 아래 아이디어를 책 한 권의 기획서로 넓혀 주세요.
이 기획서는 이후 모든 장을 쓸 때 기준 문서(스토리 바이블)로 씁니다.

${head}${block("고른 아이디어", input.idea)}${market}${block("저자 정보", input.authorInfo)}
${
  input.kind === "fiction"
    ? `다음을 정리하세요.
1. 주요 인물 3명 — 이름, 나이, 겉모습, 원하는 것, 두려워하는 것, 말버릇
2. 핵심 배경·설정 3가지 — 장소, 시대, 규칙
3. 중심 갈등과 절정(클라이맥스)
4. 결말 방향
5. 작품 전체의 분위기와 주제
6. 이 장르 독자가 기대하는 것과, 그것을 어떻게 채우고 어떻게 뒤집을지`
    : `다음을 정리하세요.
1. 핵심 메시지 한 문장
2. 대상 독자와 그 독자가 겪는 문제
3. 독자에게 하는 약속 3가지
4. 저자가 이 책을 쓸 자격 — [저자 정보]에 있는 것만 쓰고, 모르면 [작가가 채울 것]으로 비워두세요
5. 책 전체의 흐름 — 독자가 어디서 출발해 어디에 도착하는지
6. 장마다 쓸 저자의 실제 경험 목록 — [저자 정보]·[작가의 처음 생각]에 있는 것만. 부족하면 "작가가 떠올려야 할 경험" 질문으로 남기세요
7. 책 전체의 어조 — 누구에게 어떤 말투로 말하는지`
}${HONESTY_RULE}`;

    case "titles":
      return `당신은 단행본 편집장입니다. 이 책의 제목과 부제 후보를 만들어 주세요.

${head}${market}${block("기획서", input.bible)}
후보 10개를 아래 네 유형에서 고루 만드세요.
- 약속형: 독자가 얻는 결과를 말한다
- 호기심형: 읽고 싶게 만드는 질문·역설
- 정체성형: "이런 사람을 위한 책"
- 키워드형: 독자가 서점에서 검색할 말을 그대로 쓴다

각 후보는 이렇게 쓰세요.
번호. 제목 — 부제
   유형 / 좋은 점 / 걱정되는 점

마지막에 추천 3개를 고르고, 판단 기준(한 번에 이해되는가 · 검색되는가 · 경쟁 도서와 겹치지 않는가 · 표지에서 읽히는 길이인가)으로 이유를 쓰세요.
제목에 확인되지 않은 숫자나 "베스트셀러"·"최초" 같은 말을 넣지 마세요.`;

    case "outline":
      return `당신은 단행본 편집자입니다. 아래 기획서를 바탕으로 전체 목차를 ${input.chapterCount ?? 12}개 장으로 만들어 주세요.

${head}${market}${block("기획서", input.bible)}${block("근거 자료", input.sources)}
판매용 목차의 조건:
- 서점에서 독자는 목차를 보고 산다. 장 제목만 읽어도 "이건 읽어야겠다"는 마음이 들게, 각 장 제목이 독자의 문제나 궁금증을 건드리게 쓰세요. "서론", "개요" 같은 제목은 쓰지 마세요.
- 앞 장이 다음 장을 읽을 이유를 만들도록 순서를 짜세요.
- 각 장의 요약은 고스트라이터에게 넘겨 바로 초안을 쓸 수 있을 만큼 구체적인 사건과 행동${
        input.kind === "nonfiction" ? "(다룰 개념·사례·실행 과제)" : ""
      }을 담아 3~5문장으로 쓰세요.

반드시 아래 JSON 배열 하나만 출력하세요. 다른 말은 쓰지 마세요.
[{"title": "장 제목", "summary": "구체적인 요약"}]`;

    case "beats":
      return `당신은 단행본 편집자입니다. 아래 장을 12~15단계의 세부 장면으로 나눠 주세요.

${head}${block("기획서", input.bible)}${block("전체 목차", input.outline)}
[이번 장]
제목: ${input.chapterTitle ?? ""}
요약: ${input.chapterSummary ?? ""}

${chapterFormula(input.kind)}

위 구성이 드러나게, 한 줄에 한 단계씩 번호를 붙여 "누가 무엇을 한다" 수준으로 구체적으로 쓰세요.
단계 목록만 출력하세요.`;

    case "draft":
      return `당신은 단행본 고스트라이터입니다. 아래 장면 분해를 따라 이번 장의 본문 초안을 쓰세요.

${head}${market}${block("기획서", input.bible)}${block("근거 자료", input.sources)}
[이번 장]
제목: ${input.chapterTitle ?? ""}
요약: ${input.chapterSummary ?? ""}
${input.chapterTarget ? `이 장의 최종 목표 분량: 약 ${input.chapterTarget.toLocaleString()}자\n` : ""}${block("장면 분해", input.beats)}${block("바로 앞 장의 끝부분", input.previous)}${styleRule(input.styleSample)}${factRule(input)}
${chapterFormula(input.kind)}

쓰는 방법:
- 장면 분해의 순서를 따르세요. 이번에는 약 ${DRAFT_CHUNK_CHARS.toLocaleString()}자까지만 쓰고, 문단이 끝나는 자연스러운 곳에서 멈추세요. 뒷부분은 「이어 쓰기」로 채웁니다.
- 요약하듯 쓰지 말고, 장면과 사례를 보여주듯 쓰세요.
- 대상 독자가 읽는다고 생각하고 그 사람에게 말하듯 쓰세요.
- 제목·머리말·설명 없이 본문만 출력하세요.`;

    case "continue":
      return `당신은 단행본 고스트라이터입니다. 아래 장의 본문을 멈춘 곳에서 이어 쓰세요.

${head}${block("기획서", input.bible)}${block("근거 자료", input.sources)}
[이번 장]
제목: ${input.chapterTitle ?? ""}
요약: ${input.chapterSummary ?? ""}
${input.chapterTarget ? `이 장의 최종 목표 분량: 약 ${input.chapterTarget.toLocaleString()}자 · 지금까지 ${(input.draft ?? "").replace(/\s/g, "").length.toLocaleString()}자\n` : ""}${block("장면 분해", input.beats)}${block("지금까지 쓴 본문(끝부분)", input.draft ? tail(input.draft, 3000) : "")}${styleRule(input.styleSample)}${factRule(input)}
쓰는 방법:
- 지금까지 쓴 본문의 마지막 문장 바로 다음부터 이어 쓰세요. 이미 쓴 내용을 되풀이하지 마세요.
- 장면 분해 가운데 아직 쓰지 않은 단계를 순서대로 쓰세요. 이번에는 약 ${DRAFT_CHUNK_CHARS.toLocaleString()}자까지만 씁니다.
- 장면 분해를 모두 썼다면 장의 마무리(한 줄 정리와 다음 장으로 이어지는 문장)로 끝내세요.
- 이어지는 본문만 출력하세요.`;

    case "review":
      return `당신은 경력 20년의 단행본 편집장입니다. 아래 원고를 "서점에서 팔릴 책인가"의 기준으로 냉정하게 검토하세요.
원고를 고쳐 쓰지 말고, 작가가 직접 고칠 수 있도록 무엇을 어떻게 고칠지만 알려주세요.

${head}${market}${block("근거 자료", input.sources)}
[검토할 장]
제목: ${input.chapterTitle ?? ""}
요약: ${input.chapterSummary ?? ""}
${block("원고", input.draft)}
${chapterFormula(input.kind)}

다음 형식으로 쓰세요.
1. 점수표 — 항목마다 1~5점과 한 줄 이유
   - 첫 문단 훅 / 독자 약속 이행 / 구체성(사례·장면) / ${input.kind === "nonfiction" ? "실행 가능성" : "긴장과 변화"} / 문장 리듬 / 군더더기·반복 / 다음 장으로 넘기고 싶은가
2. 가장 먼저 고칠 5가지 — 원고의 해당 문장을 "따옴표"로 짧게 인용하고, 왜 문제인지, 어떻게 고칠지
3. 잘라낼 부분 — 없어도 되는 문단
4. 사실 확인 목록 — 원고에 나온 수치·인용·실명·사례 중 [근거 자료]로 확인되지 않는 것을 모두 적으세요${input.kind === "fiction" ? "(소설이면 설정 모순을 적으세요)" : ""}
5. 한 줄 총평`;

    case "sales":
      return `당신은 단행본 마케팅 편집자입니다. 이 책을 팔기 위한 문안을 만들어 주세요.

${head}${market}${block("기획서", input.bible)}${block("전체 목차", input.outline)}${block("저자 정보", input.authorInfo)}
다음 네 가지를 차례로 쓰세요.

■ 1. 뒷표지 카피 (300자 안팎)
독자의 문제로 시작해, 이 책의 약속으로 끝나게.

■ 2. 온라인 서점 책 소개
- 한 줄 소개 (40자 이내)
- 짧은 소개 (200자)
- 긴 소개 (800자) — 문제 → 이 책이 다르게 보는 점 → 독자가 얻는 것 → 이런 분께 권합니다(3~5줄)

■ 3. 저자 소개 (200자)
[저자 정보]에 적힌 사실만. 부족하면 [작가가 채울 것]으로 비워두세요.

■ 4. 출판사 투고용 기획서
가제 / 부제 / 분야 / 예상 분량 / 기획 의도 / 대상 독자 / 경쟁 도서와 차별점 / 목차 요약 / 저자 소개 / 저자가 직접 할 수 있는 홍보(저자 정보에 있는 채널만) / 이 책이 지금 나와야 하는 이유
${HONESTY_RULE}`;

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

/** 목차를 사람이 읽는 글로 — beats·draft·sales 단계에 맥락으로 넘긴다. */
export function outlineText(chapters: OutlineChapter[]): string {
  return chapters.map((c, i) => `${i + 1}장. ${c.title}\n${c.summary}`).join("\n\n");
}
