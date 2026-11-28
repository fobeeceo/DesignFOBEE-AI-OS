import { NEVER_INVENT, askJson } from "@/lib/publishing/ai";
import type { ManuscriptUnit } from "@/lib/publishing/manuscript";

/**
 * AI 편집장 — 원고 전체의 구성을 본다.
 *
 * 하는 일: 목차 초안, 중복 일화 탐지, 서사 흐름의 빈 곳 지적.
 * 하지 않는 일: 문장을 고치지 않는다(교정 담당의 몫). 어느 구성이 옳은지 정하지 않는다(저자의 몫).
 *
 * ⚠️ 장 전문을 다 보내지 않고 머리 부분만 보낸다. 구성을 보는 데는 그것으로 충분하고,
 *    전문을 보내면 긴 원고에서 뒤쪽 장이 통째로 무시된다.
 */

/** 장마다 AI에게 보여줄 머리 글자 수. 중복 일화를 알아보기에 충분한 길이로 잡았다. */
const EXCERPT_CHARS = 900;

export type EditorFinding = {
  /** 목차 초안 — 지금 제목을 그대로 두자는 제안도 포함된다. */
  목차: { id: string; 제안제목: string; 사유: string }[];
  /** 같은 일화가 여러 장에 나오는 것으로 보이는 경우. */
  중복의심: { 장: string[]; 무엇이: string; 근거: string }[];
  /** 흐름이 끊기거나 설명 없이 건너뛴 곳. */
  흐름: { id: string; 문제: string; 제안: string }[];
  /** 두세 문장 총평. */
  총평: string;
};

function excerpt(unit: ManuscriptUnit): string {
  const head = unit.body.slice(0, EXCERPT_CHARS);
  const more = unit.body.length > EXCERPT_CHARS ? " …(이하 생략)" : "";
  return `[${unit.id}] ${unit.part ? unit.part + " / " : ""}${unit.heading}${
    unit.subtitle ? " — " + unit.subtitle : ""
  } (${unit.chars.toLocaleString()}자)\n${head}${more}`;
}

function buildPrompt(units: ManuscriptUnit[]): string {
  return `당신은 자서전 전문 편집장입니다. 아래는 한 사람의 자서전 원고를 장 단위로 쪼갠 것입니다.
각 장은 머리 부분만 발췌했습니다.

${NEVER_INVENT}

[원고]
${units.map(excerpt).join("\n\n---\n\n")}

다음 네 가지만 보고하세요.

1. 목차 — 각 장의 제목을 검토합니다. 지금 제목이 좋으면 그대로 두자고 하세요.
   바꾸자고 할 때는 본문에 실제로 있는 내용에 근거해야 합니다.
2. 중복의심 — 같은 일화가 둘 이상의 장에 나오는 것으로 보이면 짚으세요.
   비슷한 주제인 것과 같은 사건인 것을 구분하세요. 확실하지 않으면 적지 마세요.
3. 흐름 — 앞뒤가 설명 없이 건너뛰거나, 독자가 따라가기 어려운 지점을 짚으세요.
4. 총평 — 두세 문장. 칭찬이 아니라 이 원고가 지금 무엇이 부족한지 적으세요.

JSON으로만 답하세요:
{
  "목차": [{"id": "ch-1", "제안제목": "...", "사유": "..."}],
  "중복의심": [{"장": ["ch-2", "ch-5"], "무엇이": "...", "근거": "..."}],
  "흐름": [{"id": "ch-3", "문제": "...", "제안": "..."}],
  "총평": "..."
}`;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * 돌려받은 결과를 정리한다.
 *
 * ⚠️ 존재하지 않는 장 id를 가리키는 항목은 버린다 — AI가 `ch-9`를 지어내면
 *    대표가 없는 장을 찾아 헤매게 된다(§0-2 원칙 7).
 */
export function normalizeEditorFinding(raw: unknown, units: ManuscriptUnit[]): EditorFinding {
  const known = new Set(units.map((u) => u.id));
  const r = (raw ?? {}) as Record<string, unknown>;

  return {
    목차: asArray(r.목차)
      .map((x) => x as Record<string, unknown>)
      .filter((x) => known.has(str(x.id)))
      .map((x) => ({ id: str(x.id), 제안제목: str(x.제안제목), 사유: str(x.사유) }))
      .filter((x) => x.제안제목),
    중복의심: asArray(r.중복의심)
      .map((x) => x as Record<string, unknown>)
      .map((x) => ({
        장: asArray(x.장).map(str).filter((id) => known.has(id)),
        무엇이: str(x.무엇이),
        근거: str(x.근거),
      }))
      .filter((x) => x.장.length >= 2 && x.무엇이),
    흐름: asArray(r.흐름)
      .map((x) => x as Record<string, unknown>)
      .filter((x) => known.has(str(x.id)))
      .map((x) => ({ id: str(x.id), 문제: str(x.문제), 제안: str(x.제안) }))
      .filter((x) => x.문제),
    총평: str(r.총평),
  };
}

export async function reviewStructure(units: ManuscriptUnit[]): Promise<EditorFinding> {
  const chapters = units.filter((u) => u.kind !== "part");
  if (chapters.length === 0) {
    return { 목차: [], 중복의심: [], 흐름: [], 총평: "원고가 비어 있습니다." };
  }
  return normalizeEditorFinding(await askJson(buildPrompt(chapters)), chapters);
}

/** 대표가 읽을 보고서. */
export function editorFindingToMarkdown(f: EditorFinding, units: ManuscriptUnit[]): string {
  const title = (id: string) => {
    const u = units.find((x) => x.id === id);
    return u ? `${u.heading}${u.subtitle ? " — " + u.subtitle : ""}` : id;
  };
  const lines: string[] = ["# 편집장 검토", ""];

  lines.push(`장 ${units.filter((u) => u.kind === "chapter").length}개 · 총 ${units
    .reduce((a, u) => a + u.chars, 0)
    .toLocaleString()}자`);
  lines.push("");
  lines.push("> 구성 제안입니다. 최종 결정은 저자가 합니다.");
  lines.push("");

  if (f.총평) {
    lines.push("## 총평", "", f.총평, "");
  }

  lines.push("## 중복으로 보이는 일화", "");
  if (f.중복의심.length === 0) lines.push("찾지 못했습니다.", "");
  for (const d of f.중복의심) {
    lines.push(`- **${d.무엇이}**`);
    lines.push(`  - 해당 장: ${d.장.map((id) => `${id} (${title(id)})`).join(" / ")}`);
    if (d.근거) lines.push(`  - 근거: ${d.근거}`);
  }
  lines.push("");

  lines.push("## 흐름이 끊기는 곳", "");
  if (f.흐름.length === 0) lines.push("찾지 못했습니다.", "");
  for (const x of f.흐름) {
    lines.push(`- **${title(x.id)}** — ${x.문제}`);
    if (x.제안) lines.push(`  - 제안: ${x.제안}`);
  }
  lines.push("");

  lines.push("## 목차 제안", "");
  if (f.목차.length === 0) lines.push("제안 없음.", "");
  for (const t of f.목차) {
    lines.push(`- ${t.id} \`${title(t.id)}\` → **${t.제안제목}**`);
    if (t.사유) lines.push(`  - ${t.사유}`);
  }
  lines.push("");

  return lines.join("\n");
}
