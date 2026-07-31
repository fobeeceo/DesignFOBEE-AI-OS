import { describe, it, expect } from "vitest";
import {
  diagnoseFit,
  classifyLead,
  calculatePriority,
  buildAiSummary,
  suggestNextAction,
} from "./leadIntelligence";
import { recommendCases, recommendCaseCodes, getCasesByCodes } from "./successCases";

describe("diagnoseFit", () => {
  it("모든 조건이 좋으면 높은 점수와 우선 배정 안내를 반환한다", () => {
    const fit = diagnoseFit({
      expectedInvestment: "2억 원 이상",
      plannedTiming: "3개월 이내",
      hasStorefront: true,
      preferredRegion: "서울",
      currentOccupation: "자영업",
      message: "은평구 인근에서 카페 창업을 준비하고 있습니다.",
    });

    expect(fit.score).toBe(100);
    expect(fit.stars).toBe(5);
    expect(fit.headline).toContain("매우 높습니다");
  });

  it("정보가 거의 없으면 낮은 점수를 반환하고 점수 범위를 벗어나지 않는다", () => {
    const fit = diagnoseFit({});

    expect(fit.score).toBe(0);
    expect(fit.stars).toBeGreaterThanOrEqual(1);
    expect(fit.stars).toBeLessThanOrEqual(5);
  });

  it("중간 조건이면 상권 분석을 먼저 권한다", () => {
    const fit = diagnoseFit({
      expectedInvestment: "1억 원 미만",
      plannedTiming: "1년 이내",
      hasStorefront: false,
      preferredRegion: "경기",
    });

    expect(fit.score).toBeGreaterThanOrEqual(40);
    expect(fit.score).toBeLessThan(60);
    expect(fit.headline).toContain("상권 분석");
  });

  it("'미정' 지역은 상담 구체성 점수로 인정하지 않는다", () => {
    const undecided = diagnoseFit({ preferredRegion: "미정" });
    const decided = diagnoseFit({ preferredRegion: "서울" });

    expect(decided.score).toBeGreaterThan(undecided.score);
  });
});

describe("classifyLead", () => {
  it("상담 목적과 문의 내용 키워드로 태그를 만든다", () => {
    const tags = classifyLead({
      consultationPurpose: "신규창업",
      message: "교회 안에 카페를 만들고 싶습니다. 상권도 봐주세요.",
    });

    expect(tags).toContain("신규창업");
    expect(tags).toContain("교회카페");
    expect(tags).toContain("카페");
    expect(tags).toContain("상권분석");
  });

  it("점포 보유·단기 창업 신호를 태그로 남긴다", () => {
    const tags = classifyLead({ hasStorefront: true, plannedTiming: "3개월 이내" });

    expect(tags).toContain("점포보유");
    expect(tags).toContain("단기창업");
  });

  it("중복 태그를 만들지 않는다", () => {
    const tags = classifyLead({ consultationPurpose: "카페", message: "카페 카페 카페" });

    expect(tags.filter((t) => t === "카페")).toHaveLength(1);
  });
});

describe("calculatePriority", () => {
  it("투자금·시기·점포가 모두 좋으면 HIGH", () => {
    expect(
      calculatePriority({
        expectedInvestment: "2억 원 이상",
        plannedTiming: "3개월 이내",
        hasStorefront: true,
      })
    ).toBe("HIGH");
  });

  it("조건이 중간이면 MEDIUM", () => {
    expect(
      calculatePriority({ expectedInvestment: "1억 ~ 1.5억 원", plannedTiming: "1년 이내" })
    ).toBe("MEDIUM");
  });

  it("정보가 없으면 LOW", () => {
    expect(calculatePriority({})).toBe("LOW");
  });
});

describe("성공사례 추천", () => {
  it("교회 태그면 교회 사례를 추천한다", () => {
    const cases = recommendCases(["교회카페"]);

    expect(cases.some((c) => c.code === "SUCCESS-004")).toBe(true);
  });

  it("매칭 태그가 없으면 기본 사례를 안내한다", () => {
    const cases = recommendCases(["존재하지않는태그"]);

    expect(cases).toHaveLength(1);
    expect(cases[0].code).toBe("SUCCESS-001");
  });

  it("추천 개수 제한을 지킨다", () => {
    expect(recommendCaseCodes(["신규창업", "카페", "인테리어", "상권분석"], 2)).toHaveLength(2);
  });

  it("저장된 코드로 사례를 복원하고 없는 코드는 무시한다", () => {
    const found = getCasesByCodes(["SUCCESS-001", "SUCCESS-999"]);

    expect(found).toHaveLength(1);
    expect(found[0].code).toBe("SUCCESS-001");
  });
});

describe("관리자 초안 생성", () => {
  it("요약에 핵심 상담 조건을 담는다", () => {
    const signals = {
      preferredRegion: "서울",
      plannedTiming: "3개월 이내",
      expectedInvestment: "2억 원 이상",
      hasStorefront: true,
    };
    const fit = diagnoseFit(signals);
    const summary = buildAiSummary(signals, fit, calculatePriority(signals));

    expect(summary).toContain("서울");
    expect(summary).toContain("HIGH");
    expect(summary).toContain("점포 보유");
  });

  it("우선순위별로 다음 액션이 다르다", () => {
    expect(suggestNextAction("HIGH")).not.toBe(suggestNextAction("LOW"));
    expect(suggestNextAction("HIGH")).toContain("24시간");
  });
});
