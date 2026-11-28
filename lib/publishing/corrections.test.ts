import { describe, expect, it } from "vitest";
import {
  applyCorrections,
  correctionsToMarkdown,
  verifyCorrections,
  type Correction,
} from "@/lib/publishing/corrections";

const BODY = `2000년 10월 27일, 서울의 작은 사무실에서 나는 처음으로 선을 그었다.
친구에게 빌린 책상 위에서 시작했다. 자본금은 카드론 천만원이었다.
그때는 정말 정말 막막했다.`;

describe("verifyCorrections — 지어낸 원문 걸러내기", () => {
  it("본문에 있는 제안은 받아들인다", () => {
    const r = verifyCorrections(BODY, [
      { 원문: "카드론 천만원", 수정안: "카드론 천만 원", 사유: "단위는 띄어 씁니다", 종류: "띄어쓰기" },
    ]);
    expect(r.accepted).toHaveLength(1);
    expect(r.rejected).toHaveLength(0);
  });

  it("원고에 없는 원문은 버린다 — 이것이 이 모듈의 존재 이유다", () => {
    const r = verifyCorrections(BODY, [
      { 원문: "아버지는 목수였다", 수정안: "아버지는 목수셨다", 사유: "높임", 종류: "어색한표현" },
    ]);
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected[0].reason).toContain("지어낸");
  });

  it("지어낸 것만 버리고 멀쩡한 것은 남긴다", () => {
    const r = verifyCorrections(BODY, [
      { 원문: "없는 문장입니다", 수정안: "고친 문장", 사유: "x", 종류: "맞춤법" },
      { 원문: "정말 정말 막막했다", 수정안: "정말 막막했다", 사유: "반복", 종류: "반복표현" },
    ]);
    expect(r.accepted).toHaveLength(1);
    expect(r.accepted[0].원문).toBe("정말 정말 막막했다");
    expect(r.rejected).toHaveLength(1);
  });

  it("원문이 여러 번 나오면 버린다 — 어디를 고칠지 알 수 없다", () => {
    const r = verifyCorrections("같은 말. 같은 말.", [
      { 원문: "같은 말", 수정안: "다른 말", 사유: "x", 종류: "맞춤법" },
    ]);
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected[0].reason).toContain("2번");
  });

  it("수정안이 원문과 같으면 버린다", () => {
    const r = verifyCorrections(BODY, [
      { 원문: "카드론 천만원", 수정안: "카드론 천만원", 사유: "x", 종류: "맞춤법" },
    ]);
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected[0].reason).toContain("같음");
  });

  it("빠진 항목이 있으면 버린다", () => {
    const r = verifyCorrections(BODY, [
      { 원문: "카드론 천만원", 수정안: "", 사유: "x", 종류: "맞춤법" },
      { 수정안: "무언가", 사유: "x", 종류: "맞춤법" },
    ]);
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected).toHaveLength(2);
  });

  it("모르는 종류는 '어색한표현'으로 둔다 — 제안 자체를 버리지는 않는다", () => {
    const r = verifyCorrections(BODY, [
      { 원문: "카드론 천만원", 수정안: "카드론 천만 원", 사유: "x", 종류: "아무거나" },
    ]);
    expect(r.accepted[0].종류).toBe("어색한표현");
  });

  it("목록이 아니면 통째로 버린다", () => {
    expect(verifyCorrections(BODY, { 원문: "x" }).accepted).toHaveLength(0);
    expect(verifyCorrections(BODY, null).accepted).toHaveLength(0);
  });

  it("빈 목록은 빈 결과", () => {
    const r = verifyCorrections(BODY, []);
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected).toHaveLength(0);
  });
});

describe("applyCorrections", () => {
  const corrections: Correction[] = [
    { 원문: "카드론 천만원", 수정안: "카드론 천만 원", 사유: "띄어쓰기", 종류: "띄어쓰기" },
    { 원문: "정말 정말 막막했다", 수정안: "정말 막막했다", 사유: "반복", 종류: "반복표현" },
  ];

  it("수정안을 적용한다", () => {
    const out = applyCorrections(BODY, corrections);
    expect(out).toContain("카드론 천만 원");
    expect(out).toContain("정말 막막했다");
    expect(out).not.toContain("정말 정말");
  });

  it("손대지 않은 대목은 글자 그대로 남는다", () => {
    const out = applyCorrections(BODY, corrections);
    expect(out).toContain("2000년 10월 27일, 서울의 작은 사무실에서 나는 처음으로 선을 그었다.");
    expect(out).toContain("친구에게 빌린 책상 위에서 시작했다.");
  });

  it("원본 문자열을 바꾸지 않는다", () => {
    const before = BODY;
    applyCorrections(BODY, corrections);
    expect(BODY).toBe(before);
  });

  it("수정이 없으면 본문 그대로", () => {
    expect(applyCorrections(BODY, [])).toBe(BODY);
  });
});

describe("correctionsToMarkdown", () => {
  it("원문·수정안·사유를 모두 싣는다 — 조용히 고치지 않는다", () => {
    const r = verifyCorrections(BODY, [
      { 원문: "카드론 천만원", 수정안: "카드론 천만 원", 사유: "단위는 띄어 씁니다", 종류: "띄어쓰기" },
    ]);
    const md = correctionsToMarkdown("제1장 창업의 새벽", r);
    expect(md).toContain("제1장 창업의 새벽");
    expect(md).toContain("카드론 천만원");
    expect(md).toContain("카드론 천만 원");
    expect(md).toContain("단위는 띄어 씁니다");
    expect(md).toContain("대표가 고릅니다");
  });

  it("걸러낸 것도 기록으로 남긴다", () => {
    const r = verifyCorrections(BODY, [
      { 원문: "없는 문장", 수정안: "고친 것", 사유: "x", 종류: "맞춤법" },
    ]);
    const md = correctionsToMarkdown("제1장", r);
    expect(md).toContain("걸러낸 제안");
    expect(md).toContain("지어낸");
  });

  it("고칠 곳이 없으면 없다고 쓴다 — 빈 보고서를 내지 않는다", () => {
    const md = correctionsToMarkdown("제1장", { accepted: [], rejected: [] });
    expect(md).toContain("찾지 못했습니다");
  });
});
