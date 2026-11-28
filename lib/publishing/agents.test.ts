import { describe, expect, it } from "vitest";
import { chunkBody, mergeResults } from "@/agents/proofreaderAgent";
import { normalizeEditorFinding } from "@/agents/editorInChiefAgent";
import { splitManuscript, type ManuscriptUnit } from "@/lib/publishing/manuscript";

const UNITS: ManuscriptUnit[] = splitManuscript(
  "제1장\n시작\n\n첫 문장.\n\n제2장\n다음\n\n둘째 문장."
);

describe("chunkBody — 조각내기", () => {
  it("짧은 본문은 한 조각", () => {
    expect(chunkBody("짧은 글입니다.")).toEqual(["짧은 글입니다."]);
  });

  it("빈 본문은 조각이 없다", () => {
    expect(chunkBody("   \n ")).toEqual([]);
  });

  it("긴 본문을 문단 경계에서 나눈다", () => {
    const p = "가".repeat(300);
    const body = Array(10).fill(p).join("\n\n");
    const chunks = chunkBody(body, 1000);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(1000);
  });

  it("문단 중간을 자르지 않는다 — 원문이 두 조각에 걸치면 찾을 수 없다", () => {
    const body = ["첫 문단입니다.", "둘째 문단입니다.", "셋째 문단입니다."].join("\n\n");
    for (const c of chunkBody(body, 20)) {
      expect(c.trim().endsWith(".")).toBe(true);
    }
  });

  it("문단 하나가 한계를 넘으면 줄 단위로 더 쪼갠다 — 구술 원고에 흔하다", () => {
    const body = Array(20).fill("한 줄입니다.").join("\n");
    const chunks = chunkBody(body, 50);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(50);
  });

  it("쪼개도 글자는 하나도 잃지 않는다", () => {
    const body = Array(12).fill("문단 내용입니다.").join("\n\n");
    const rejoined = chunkBody(body, 60).join("\n\n");
    expect(rejoined.replace(/\s+/g, "")).toBe(body.replace(/\s+/g, ""));
  });
});

describe("mergeResults", () => {
  it("여러 조각의 결과를 합친다", () => {
    const merged = mergeResults([
      { accepted: [{ 원문: "가", 수정안: "나", 사유: "x", 종류: "맞춤법" }], rejected: [] },
      { accepted: [], rejected: [{ correction: {}, reason: "지어낸 문장" }] },
    ]);
    expect(merged.accepted).toHaveLength(1);
    expect(merged.rejected).toHaveLength(1);
  });

  it("빈 입력은 빈 결과", () => {
    expect(mergeResults([])).toEqual({ accepted: [], rejected: [] });
  });
});

describe("normalizeEditorFinding — 없는 장을 가리키는 항목 걸러내기", () => {
  it("실재하는 장만 남긴다", () => {
    const f = normalizeEditorFinding(
      {
        목차: [
          { id: "ch-1", 제안제목: "새 제목", 사유: "본문과 맞다" },
          { id: "ch-99", 제안제목: "없는 장", 사유: "x" },
        ],
        흐름: [{ id: "ch-9", 문제: "없는 장", 제안: "x" }],
        총평: "총평입니다.",
      },
      UNITS
    );
    expect(f.목차).toHaveLength(1);
    expect(f.목차[0].id).toBe("ch-1");
    expect(f.흐름).toHaveLength(0);
    expect(f.총평).toBe("총평입니다.");
  });

  it("중복의심은 실재하는 장이 둘 이상일 때만 남긴다", () => {
    const f = normalizeEditorFinding(
      {
        중복의심: [
          { 장: ["ch-1", "ch-2"], 무엇이: "같은 일화", 근거: "둘 다 창업 첫날" },
          { 장: ["ch-1", "ch-99"], 무엇이: "한쪽이 없는 장", 근거: "x" },
          { 장: ["ch-1"], 무엇이: "혼자서는 중복이 아니다", 근거: "x" },
        ],
      },
      UNITS
    );
    expect(f.중복의심).toHaveLength(1);
    expect(f.중복의심[0].장).toEqual(["ch-1", "ch-2"]);
  });

  it("제안제목이나 문제 설명이 비면 버린다", () => {
    const f = normalizeEditorFinding(
      { 목차: [{ id: "ch-1", 제안제목: "", 사유: "x" }], 흐름: [{ id: "ch-1", 문제: "" }] },
      UNITS
    );
    expect(f.목차).toHaveLength(0);
    expect(f.흐름).toHaveLength(0);
  });

  it("엉뚱한 응답이 와도 터지지 않는다", () => {
    for (const bad of [null, undefined, "문자열", 42, []]) {
      const f = normalizeEditorFinding(bad, UNITS);
      expect(f.목차).toEqual([]);
      expect(f.중복의심).toEqual([]);
      expect(f.흐름).toEqual([]);
      expect(f.총평).toBe("");
    }
  });
});
