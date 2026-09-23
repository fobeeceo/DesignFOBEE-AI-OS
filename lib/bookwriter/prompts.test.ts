import { describe, expect, it } from "vitest";
import { buildPrompt, outlineText, parseOutline, tail, type PromptInput } from "@/lib/bookwriter/prompts";
import { chapterTarget, emptyProject, normalizeProject, targetChars, toMarkdown } from "@/lib/bookwriter/project";
import { buildBookDocx, docxFileName } from "@/lib/bookwriter/exportDocx";

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
      review: "",
    });
  });

  it("원고 내보내기는 초안이 있는 장만 싣는다", () => {
    const p = {
      ...emptyProject(),
      title: "책",
      chapters: [
        { title: "하나", summary: "", beats: "", draft: "본문", review: "" },
        { title: "둘", summary: "", beats: "", draft: " ", review: "" },
      ],
    };
    expect(toMarkdown(p)).toBe("# 책\n\n## 1장. 하나\n\n본문\n");
  });
});

describe("판매용 단계", () => {
  const nf: Omit<PromptInput, "step"> = { ...base, kind: "nonfiction" };

  it("시장 기획·판매 문안은 실제 책 제목·판매량·'베스트셀러'를 지어내지 말라고 지시한다", () => {
    for (const step of ["market", "sales", "ideas", "bible"] as const) {
      const p = buildPrompt({ ...nf, step });
      expect(p).toContain("판매량");
      expect(p).toContain("베스트셀러");
    }
  });

  it("작가가 조사한 경쟁 도서와 저자 정보를 그대로 넘긴다", () => {
    const p = buildPrompt({ ...nf, step: "market", comps: "책A — 저자B", authorInfo: "공간디자인 회사 대표" });
    expect(p).toContain("책A — 저자B");
    expect(p).toContain("공간디자인 회사 대표");
  });

  it("장 설계는 비소설 판매 공식(첫 문단 훅 → 실행 도구)을 따른다", () => {
    const p = buildPrompt({ ...nf, step: "beats", chapterTitle: "1장" });
    expect(p).toContain("첫 문단 훅");
    expect(p).toContain("실행 도구");
  });

  it("이어 쓰기는 지금까지 쓴 본문의 끝부분과 글자 수를 넘긴다", () => {
    const draft = "가".repeat(5000) + "마지막문장";
    const p = buildPrompt({ ...nf, step: "continue", draft, chapterTarget: 13200 });
    expect(p).toContain("마지막문장");
    expect(p).not.toContain("가".repeat(4000));
    expect(p).toContain("13,200자");
    expect(p).toContain("5,005자");
  });

  it("편집자 검토는 원고를 고쳐 쓰지 말고 사실 확인 목록을 내라고 한다", () => {
    const p = buildPrompt({ ...nf, step: "review", draft: "본문" });
    expect(p).toContain("고쳐 쓰지 말고");
    expect(p).toContain("사실 확인 목록");
  });
});

describe("목표 분량 — 자동 계산", () => {
  it("240쪽 × 660자, 장 수로 나눠 백 단위로", () => {
    const p = emptyProject();
    expect(targetChars(p)).toBe(158400);
    expect(chapterTarget(p)).toBe(13200);
    const withChapters = { ...p, chapters: Array.from({ length: 10 }, () => ({ title: "", summary: "", beats: "", draft: "", review: "" })) };
    expect(chapterTarget(withChapters)).toBe(15800);
  });
});

describe("투고 원고(Word)", () => {
  it("파일명에서 쓸 수 없는 문자를 걷어내고, 제목이 없으면 지어내지 않는다", () => {
    const d = new Date(2026, 8, 23);
    expect(docxFileName('공간이: 브랜드다?', d)).toBe("공간이 브랜드다_투고원고_2026-09-23.docx");
    expect(docxFileName("", d)).toBe("책_투고원고_2026-09-23.docx");
  });

  it("표지·차례·본문이 실제 .docx에 들어간다", async () => {
    const p = {
      ...emptyProject(),
      title: "공간이 브랜드다",
      author: "홍길동",
      chapters: [
        { title: "첫 장", summary: "", beats: "", draft: "첫 문단\n둘째 문단", review: "" },
        { title: "빈 장", summary: "", beats: "", draft: "", review: "" },
      ],
    };
    const blob = await buildBookDocx(p);
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(Buffer.from(await blob.arrayBuffer()));
    const xml = await zip.file("word/document.xml")!.async("string");
    for (const t of ["공간이 브랜드다", "홍길동 지음", "차례", "1장. 첫 장", "2장. 빈 장", "첫 문단", "둘째 문단"]) {
      expect(xml).toContain(t);
    }
  });
});
