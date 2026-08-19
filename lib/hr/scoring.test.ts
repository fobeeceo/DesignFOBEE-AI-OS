import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { QUESTIONS, PASS_SCORE, TOTAL_SCORE, gradeFor } from "@/lib/hr/diagnosisData";
import { AREA_CODES, auditQuestionSet, scoreDiagnosis } from "@/lib/hr/scoring";

const maxAnswers = () => QUESTIONS.map((q) => Math.max(...q.options.map(([, v]) => v)));
const minAnswers = () => QUESTIONS.map((q) => Math.min(...q.options.map(([, v]) => v)));

describe("문항 구조 (승인 기준)", () => {
  const audit = auditQuestionSet();

  // 2026-08-18 대표 지시로 따뜻한 아메리카노 샷 순서 문항(h-1)을 L영역에 추가 → 26문항.
  it("총 26문항", () => expect(audit.count).toBe(26));

  it("영역 분포 S2 R3 C5 L11 T5", () => {
    expect(audit.perArea).toEqual({ S: 2, R: 3, C: 5, L: 11, T: 5 });
  });

  it("기억·습득 테스트 m-1~m-3 + h-1 포함", () => {
    expect(audit.memoryTests).toEqual(["m-1", "m-2", "m-3", "h-1"]);
  });

  it("문항 id 중복 없음", () => expect(audit.duplicateIds).toEqual([]));

  it("AREA_MAX 선언값이 실제 문항 최대 원점수와 일치", () => {
    expect(audit.maxByArea).toEqual(audit.declaredMax);
  });

  it("모든 문항의 배점은 25/17/9/0", () => {
    for (const q of QUESTIONS) {
      const scores = q.options.map(([, v]) => v).sort((a, b) => b - a);
      expect(scores).toEqual([25, 17, 9, 0]);
    }
  });
});

describe("채점 기준(note) 비노출", () => {
  it("기억·습득 문항의 note는 정답 기준을 담고 있다 — 화면에 렌더링하면 안 된다", () => {
    const memo = QUESTIONS.filter((q) => q.isTest);
    expect(memo).toHaveLength(4);
    for (const q of memo) {
      expect(q.note).toContain("대표 제공");
    }
  });

  it("결과 화면에 참고 기준선(PASS_SCORE)을 표시하지 않는다", () => {
    const src = readFileSync("components/hr/DiagnosisClient.tsx", "utf8");
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    expect(code).not.toContain("PASS_SCORE");
    expect(code).not.toContain("참고 기준선");
  });

  it("DiagnosisClient가 question.note를 렌더링하지 않는다", () => {
    const src = readFileSync("components/hr/DiagnosisClient.tsx", "utf8");
    // 주석은 제거하고 JSX 본문만 본다
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    expect(code).not.toMatch(/\{\s*question\.note\s*\}/);
    expect(code).not.toMatch(/question\.note\s*&&/);
  });
});

describe("점수 계산", () => {
  it("TEST A — 모든 문항 최고점 → 영역별 100, 총 500, S", () => {
    const r = scoreDiagnosis(maxAnswers());
    AREA_CODES.forEach((c) => expect(r.byNorm[c]).toBe(100));
    expect(r.total).toBe(500);
    expect(r.grade).toBe("S");
  });

  it("TEST B — 모든 문항 최저점 → 총 0, D", () => {
    const r = scoreDiagnosis(minAnswers());
    expect(r.total).toBe(0);
    expect(r.grade).toBe("D");
  });

  it("TEST C — 영역별 서로 다른 조합이 각각 100점으로 환산된다", () => {
    // S만 만점, 나머지 0점
    const answers = QUESTIONS.map((q) =>
      q.area === "S" ? Math.max(...q.options.map(([, v]) => v)) : 0
    );
    const r = scoreDiagnosis(answers);
    expect(r.byNorm.S).toBe(100);
    expect(r.byNorm.R).toBe(0);
    expect(r.total).toBe(100);
    expect(r.grade).toBe("D");
  });

  it("TEST C-2 — L(11문항)만 만점이어도 100점이다 (문항 수가 많다고 더 받지 않는다)", () => {
    const answers = QUESTIONS.map((q) =>
      q.area === "L" ? Math.max(...q.options.map(([, v]) => v)) : 0
    );
    const r = scoreDiagnosis(answers);
    expect(r.raw.L).toBe(275);
    expect(r.byNorm.L).toBe(100);
    expect(r.total).toBe(100);
  });

  it("미응답(null)은 0점으로 처리한다", () => {
    const r = scoreDiagnosis(new Array(QUESTIONS.length).fill(null));
    expect(r.total).toBe(0);
  });

  it("총점은 500을 넘지 않는다", () => {
    expect(scoreDiagnosis(maxAnswers()).total).toBeLessThanOrEqual(TOTAL_SCORE);
  });
});

describe("등급 경계 (S450 A400 B350 C300 D0)", () => {
  it.each([
    [500, "S"],
    [450, "S"],
    [449, "A"],
    [400, "A"],
    [399, "B"],
    [350, "B"],
    [349, "C"],
    [300, "C"],
    [299, "D"],
    [0, "D"],
  ])("%i점 → %s", (total, letter) => {
    expect(gradeFor(total as number).letter).toBe(letter);
  });

  it("참고 기준선은 350점(관리자 판단용)", () => expect(PASS_SCORE).toBe(350));
  it("총점 만점은 500점", () => expect(TOTAL_SCORE).toBe(500));
});

describe("보기 순서", () => {
  it("정답이 항상 첫 번째에 오지 않도록 화면에서 섞는다", () => {
    const src = readFileSync("components/hr/DiagnosisClient.tsx", "utf8");
    expect(src).toContain("shuffledOrders");
    // 원본 배열을 그대로 렌더링하면 안 된다(정답이 늘 맨 위라 1번만 눌러도 만점).
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    expect(code).not.toMatch(/question\.options\.map\(\(\[label, score\]\)/);
  });

  it("모든 문항의 원본 데이터는 25점이 첫 보기다(섞기 전 기준)", () => {
    for (const q of QUESTIONS) {
      expect(q.options[0][1]).toBe(25);
    }
  });
});
