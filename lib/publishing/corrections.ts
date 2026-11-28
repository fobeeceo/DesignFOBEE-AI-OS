/**
 * 교정 제안 검증 — AI가 돌려준 수정안을 원문과 대조한다.
 *
 * 왜 필요한가:
 *  교정 AI는 `{원문, 수정안, 사유}`를 돌려준다. 그런데 "원문"이라며 원고에 없는
 *  문장을 지어낼 때가 있다. 그대로 받아들이면 **있지도 않은 문장을 고쳤다고
 *  보고**하게 되고, 대표가 그걸 믿고 승인하면 원고에 없던 문장이 들어간다.
 *  자서전에서 이것은 가장 나쁜 실패다(§14-A ②).
 *
 *  그래서 돌려받은 원문이 실제 본문에 **글자 그대로 있는지** 확인하고,
 *  없으면 버린다. 몇 개를 버렸는지도 함께 보고한다 — 조용히 버리면
 *  AI 품질이 나빠져도 아무도 모른다(§0-2 원칙 7).
 *
 * ⚠️ 이 모듈은 AI를 쓰지 않는다. 전부 테스트로 검증된다.
 */

export const CORRECTION_KINDS = [
  "맞춤법",
  "띄어쓰기",
  "문장호흡",
  "반복표현",
  "어색한표현",
] as const;

export type CorrectionKind = (typeof CORRECTION_KINDS)[number];

export type Correction = {
  /** 원고에 글자 그대로 있는 대목. */
  원문: string;
  수정안: string;
  사유: string;
  종류: CorrectionKind;
};

export type VerifyResult = {
  /** 본문에서 실제로 찾은 것만. */
  accepted: Correction[];
  /** 버린 것과 이유. 보고에 그대로 싣는다. */
  rejected: { correction: Partial<Correction>; reason: string }[];
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * 돌려받은 수정 제안을 검증한다.
 *
 * 버리는 경우:
 *  - 모양이 안 맞는 것(원문·수정안·사유가 비었거나 문자열이 아님)
 *  - 원문이 본문에 없는 것 → **지어낸 원문**
 *  - 원문이 본문에 여러 번 나오는 것 → 어디를 고치라는 건지 알 수 없다
 *  - 수정안이 원문과 같은 것 → 고칠 게 없다
 */
export function verifyCorrections(body: string, raw: unknown): VerifyResult {
  const accepted: Correction[] = [];
  const rejected: VerifyResult["rejected"] = [];

  if (!Array.isArray(raw)) {
    return { accepted, rejected: [{ correction: {}, reason: "목록 형태가 아님" }] };
  }

  for (const item of raw) {
    const c = item as Partial<Correction>;

    if (!isNonEmptyString(c.원문) || !isNonEmptyString(c.수정안) || !isNonEmptyString(c.사유)) {
      rejected.push({ correction: c, reason: "원문·수정안·사유 중 빠진 것이 있음" });
      continue;
    }

    const kind = (CORRECTION_KINDS as readonly string[]).includes(c.종류 as string)
      ? (c.종류 as CorrectionKind)
      : "어색한표현";

    const occurrences = countOccurrences(body, c.원문);
    if (occurrences === 0) {
      rejected.push({ correction: c, reason: "원문이 원고에 없음 — AI가 지어낸 문장" });
      continue;
    }
    if (occurrences > 1) {
      rejected.push({ correction: c, reason: `원문이 원고에 ${occurrences}번 나옴 — 어디인지 특정 불가` });
      continue;
    }
    if (c.원문 === c.수정안) {
      rejected.push({ correction: c, reason: "수정안이 원문과 같음" });
      continue;
    }

    accepted.push({ 원문: c.원문, 수정안: c.수정안, 사유: c.사유, 종류: kind });
  }

  return { accepted, rejected };
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return count;
    count += 1;
    from = at + needle.length;
  }
}

/**
 * 수정안을 적용한 본문을 만든다.
 *
 * ⚠️ 원본 파일을 덮어쓰지 않는다. 적용본은 별도 파일로 남기고, 원문·수정안·사유
 *    3단 기록도 함께 남긴다. 대표가 나중에 "왜 이렇게 바뀌었지"를 추적할 수 있어야 한다.
 */
export function applyCorrections(body: string, corrections: Correction[]): string {
  let out = body;
  for (const c of corrections) {
    // 검증을 통과한 것은 본문에 정확히 한 번 나온다. replace로 그 한 번만 바뀐다.
    out = out.replace(c.원문, c.수정안);
  }
  return out;
}

/** 대표가 읽을 3단 기록(마크다운). 조용히 고치지 않는다는 원칙의 실행부다. */
export function correctionsToMarkdown(
  unitHeading: string,
  result: VerifyResult
): string {
  const lines: string[] = [];
  lines.push(`# 교정 제안 — ${unitHeading}`);
  lines.push("");
  lines.push(`제안 ${result.accepted.length}건 · 걸러낸 것 ${result.rejected.length}건`);
  lines.push("");
  lines.push("> 모든 수정은 대표가 고릅니다. AI가 원고를 바꾸지 않습니다.");
  lines.push("");

  if (result.accepted.length === 0) {
    lines.push("고칠 곳을 찾지 못했습니다.");
  }

  result.accepted.forEach((c, i) => {
    lines.push(`## ${i + 1}. [${c.종류}]`);
    lines.push("");
    lines.push(`**원문**`);
    lines.push("");
    lines.push(`> ${c.원문}`);
    lines.push("");
    lines.push(`**수정안**`);
    lines.push("");
    lines.push(`> ${c.수정안}`);
    lines.push("");
    lines.push(`**사유** ${c.사유}`);
    lines.push("");
  });

  if (result.rejected.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## 걸러낸 제안 (대표가 볼 필요는 없지만 기록으로 남깁니다)");
    lines.push("");
    for (const r of result.rejected) {
      lines.push(`- ${r.reason} — \`${String(r.correction.원문 ?? "").slice(0, 40)}\``);
    }
    lines.push("");
  }

  return lines.join("\n");
}
