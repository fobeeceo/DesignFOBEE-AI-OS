import { describe, expect, it } from "vitest";
import { buildPrompt, outlineText, parseOutline, tail, type PromptInput } from "@/lib/bookwriter/prompts";
import { emptyProject, normalizeProject, toMarkdown } from "@/lib/bookwriter/project";

const base: Omit<PromptInput, "step"> = {
  kind: "fiction",
  genre: "미스터리",
  premise: "",
  pov: "1인칭",
  tense: "과거형",
};

describe("buildPrompt", () => {
  it("소설은 시점·시제를 싣고 비소설은 싣지 않는다", () => {
    expect(buildPrompt({ ...base, step: "ideas" })).toContain("시점: 1인칭");
    expect(buildPrompt({ ...base, kind: "nonfiction", step: "ideas" })).not.toContain("시점");
  });

  it("비소설 초안은 근거 자료만 쓰고 없으면 [확인 필요]로 두라고 지시한다", () => {
    const p = buildPrompt({ ...base, kind: "nonfiction", step: "draft", sources: "통계청 2024: 42%" });
    expect(p).toContain("통계청 2024: 42%");
    expect(p).toContain("[확인 필요");
  });

  it("소설 초안에는 사실 규칙을 붙이지 않는다", () => {
    expect(buildPrompt({ ...base, step: "draft" })).not.toContain("[확인 필요");
  });

  it("문체 견본이 있을 때만 문체 지시가 붙는다", () => {
    expect(buildPrompt({ ...base, step: "scene", beat: "문을 연다" })).not.toContain("문체 견본");
    expect(buildPrompt({ ...base, step: "scene", beat: "문을 연다", styleSample: "짧게 쓴다." })).toContain("짧게 쓴다.");
  });

  it("목차는 요청한 장 수와 JSON 형식을 지시한다", () => {
    const p = buildPrompt({ ...base, step: "outline", chapterCount: 20, bible: "인물 3명" });
    expect(p).toContain("20개 장");
    expect(p).toContain('"title"');
  });
});

describe("parseOutline", () => {
  it("코드 울타리와 앞뒤 말이 붙어도 배열을 읽는다", () => {
    const text = '여기 목차입니다\n```json\n[{"title":"시작","summary":"문을 연다"},{"title":"","summary":""}]\n```';
    expect(parseOutline(text)).toEqual([{ title: "시작", summary: "문을 연다" }]);
  });

  it("읽을 수 없으면 빈 배열", () => {
    expect(parseOutline("목차를 만들 수 없습니다")).toEqual([]);
    expect(parseOutline("[깨진 json")).toEqual([]);
  });

  it("사람이 읽는 목차로 되돌린다", () => {
    expect(outlineText([{ title: "시작", summary: "문을 연다" }])).toBe("1장. 시작\n문을 연다");
  });
});

describe("tail", () => {
  it("짧으면 그대로, 길면 끝부분만", () => {
    expect(tail("  짧다  ")).toBe("짧다");
    expect(tail("가나다라마", 2)).toBe("…라마");
  });
});

describe("project", () => {
  it("깨진 저장값도 빈 원고로 연다", () => {
    expect(normalizeProject(null)).toEqual(emptyProject());
    expect(normalizeProject({ chapters: "oops" }).chapters).toEqual([]);
    expect(normalizeProject({ chapters: [{ title: "a" }] }).chapters[0]).toEqual({
      title: "a",
      summary: "",
      beats: "",
      draft: "",
    });
  });

  it("원고 내보내기는 초안이 있는 장만 싣는다", () => {
    const p = {
      ...emptyProject(),
      title: "책",
      chapters: [
        { title: "하나", summary: "", beats: "", draft: "본문" },
        { title: "둘", summary: "", beats: "", draft: " " },
      ],
    };
    expect(toMarkdown(p)).toBe("# 책\n\n## 1장. 하나\n\n본문\n");
  });
});
