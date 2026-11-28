import { NEVER_INVENT, askJson } from "@/lib/publishing/ai";
import { verifyCorrections, type VerifyResult } from "@/lib/publishing/corrections";
import type { ManuscriptUnit } from "@/lib/publishing/manuscript";

/**
 * AI 교정·교열 직원 — 한 장씩 문장을 본다.
 *
 * 하는 일: 맞춤법·띄어쓰기·문장 호흡·반복 표현·어색한 표현.
 * 하지 않는 일: 구성을 바꾸지 않는다(편집장의 몫). 사실을 고치지 않는다(대표의 몫).
 *
 * ⚠️ 원고를 고쳐 돌려주지 않는다. `{원문, 수정안, 사유}` 목록만 돌려준다.
 *    고친 원고를 통째로 받으면 무엇이 왜 바뀌었는지 아무도 모르고, 그 안에
 *    AI가 슬쩍 넣은 문장이 섞여도 알아챌 수 없다.
 *
 * ⚠️ 돌려받은 "원문"은 반드시 verifyCorrections로 원고와 대조한다.
 *    AI가 원고에 없는 문장을 원문이라며 내놓는 일이 실제로 있다.
 */

/** 한 번에 보낼 수 있는 본문 길이. 넘으면 문단 경계에서 나눠 보낸다. */
const MAX_CHUNK = 4000;

function buildPrompt(heading: string, body: string): string {
  return `당신은 자서전 전문 교정·교열자입니다. 아래는 어떤 분의 자서전 원고 일부입니다.

${NEVER_INVENT}

[장 제목]
${heading}

[본문]
${body}

고칠 곳을 찾아 목록으로 돌려주세요.

반드시 지킬 것:
1. "원문"은 위 본문에 **글자 그대로 있는 대목**을 그대로 옮겨 적으세요.
   한 글자라도 다르면 그 제안은 버려집니다. 요약하거나 다듬어서 적지 마세요.
2. "원문"은 본문에서 **딱 한 번만 나오는** 길이로 잡으세요. 너무 짧으면 여러 곳에
   걸려 버려집니다. 보통 문장 하나가 적당합니다.
3. 저자의 말투를 지키세요. 문어체로 바꾸거나 格을 높이지 마세요.
   사투리·입버릇은 그대로 둡니다.
4. 사실·숫자·이름·날짜는 건드리지 마세요. 맞춤법이 틀려 보여도 고유명사는 그대로 둡니다.
5. 고칠 곳이 없으면 빈 목록을 돌려주세요. 억지로 찾지 마세요.
6. 종류는 다음 중 하나: 맞춤법, 띄어쓰기, 문장호흡, 반복표현, 어색한표현

JSON으로만 답하세요:
{"수정": [{"원문": "...", "수정안": "...", "사유": "...", "종류": "띄어쓰기"}]}`;
}

/**
 * 긴 본문을 문단 경계에서 나눈다.
 * 문장 중간에서 자르면 "원문"이 두 조각에 걸쳐 어느 쪽에서도 찾을 수 없게 된다.
 */
export function chunkBody(body: string, max = MAX_CHUNK): string[] {
  if (body.length <= max) return body.trim() ? [body] : [];

  const paragraphs = body.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if (current && current.length + p.length + 2 > max) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current.trim()) chunks.push(current);

  // 문단 하나가 통째로 max를 넘는 경우(구술 원고에 흔하다) — 줄 단위로 한 번 더 쪼갠다.
  return chunks.flatMap((c) => (c.length <= max ? [c] : splitLongChunk(c, max)));
}

function splitLongChunk(chunk: string, max: number): string[] {
  const out: string[] = [];
  let current = "";
  for (const line of chunk.split("\n")) {
    if (current && current.length + line.length + 1 > max) {
      out.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current.trim()) out.push(current);
  return out;
}

/** 여러 조각의 검증 결과를 하나로 합친다. */
export function mergeResults(results: VerifyResult[]): VerifyResult {
  return {
    accepted: results.flatMap((r) => r.accepted),
    rejected: results.flatMap((r) => r.rejected),
  };
}

export async function proofread(unit: ManuscriptUnit): Promise<VerifyResult> {
  const heading = `${unit.heading}${unit.subtitle ? " — " + unit.subtitle : ""}`;
  const chunks = chunkBody(unit.body);
  const results: VerifyResult[] = [];

  for (const chunk of chunks) {
    const raw = (await askJson(buildPrompt(heading, chunk))) as Record<string, unknown>;
    // 조각 단위로 대조한다. 전체 본문과 대조하면 다른 조각의 문장이 통과해
    // 엉뚱한 자리를 고치게 된다.
    results.push(verifyCorrections(chunk, raw?.수정));
  }

  return mergeResults(results);
}
