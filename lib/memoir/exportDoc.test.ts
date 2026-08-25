import { describe, expect, it } from "vitest";
import { QUESTIONS } from "@/lib/memoir/questions";
import { emptyBook, type MemoirBook } from "@/lib/memoir/manuscript";
import {
  REVIEW_NOTICE,
  buildDocxBlob,
  hasContent,
  manuscriptFileName,
  splitParagraphs,
  summaryLine,
  today,
} from "@/lib/memoir/exportDoc";

const FIXED = new Date(2026, 7, 22); // 2026-08-22

function bookWith(answers: Record<string, string>): MemoirBook {
  const book = emptyBook();
  book.title = "유리 벽돌을 쌓다";
  book.subtitle = "26년 공간 전문가의 기록";
  book.author = "이대성";
  for (const [questionId, text] of Object.entries(answers)) {
    book.answers[questionId] = { questionId, text, updatedAt: "2026-08-22T00:00:00.000Z" };
  }
  return book;
}

describe("today", () => {
  it("YYYY-MM-DD로 만든다", () => {
    expect(today(FIXED)).toBe("2026-08-22");
  });

  it("한 자리 달·일에 0을 채운다", () => {
    expect(today(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("manuscriptFileName", () => {
  it("[제목]_원고_날짜.확장자 형식이다", () => {
    expect(manuscriptFileName("유리 벽돌을 쌓다", "docx", FIXED)).toBe(
      "유리 벽돌을 쌓다_원고_2026-08-22.docx"
    );
  });

  it("파일명에 쓸 수 없는 문자를 걷어낸다", () => {
    expect(manuscriptFileName('나의 삶: 1부/2부 *중요* <초안>?', "pdf", FIXED)).toBe(
      "나의 삶 1부2부 중요 초안_원고_2026-08-22.pdf"
    );
  });

  it("제어문자를 걷어낸다", () => {
    expect(manuscriptFileName("제목\u0000\u001F\u007F", "docx", FIXED)).toBe(
      "제목_원고_2026-08-22.docx"
    );
  });

  it("줄바꿈·탭은 한 칸 공백으로 눌린다", () => {
    expect(manuscriptFileName("제목\n둘째\t줄", "docx", FIXED)).toBe(
      "제목 둘째 줄_원고_2026-08-22.docx"
    );
  });

  it("제목이 비면 지어내지 않고 '자서전'을 쓴다", () => {
    expect(manuscriptFileName("   ", "docx", FIXED)).toBe("자서전_원고_2026-08-22.docx");
    expect(manuscriptFileName("///", "pdf", FIXED)).toBe("자서전_원고_2026-08-22.pdf");
  });

  it("앞의 점을 지운다 — 숨김 파일이 되지 않게", () => {
    expect(manuscriptFileName("...제목", "docx", FIXED)).toBe("제목_원고_2026-08-22.docx");
  });

  it("아주 긴 제목을 잘라낸다", () => {
    const name = manuscriptFileName("가".repeat(200), "docx", FIXED);
    expect(name.startsWith("가".repeat(60) + "_원고_")).toBe(true);
  });
});

describe("splitParagraphs", () => {
  it("줄바꿈마다 문단을 나눈다", () => {
    expect(splitParagraphs("첫 줄\n둘째 줄\n\n셋째 줄")).toEqual(["첫 줄", "둘째 줄", "셋째 줄"]);
  });

  it("빈 줄만 있으면 아무것도 남지 않는다", () => {
    expect(splitParagraphs("\n\n   \n")).toEqual([]);
  });
});

describe("hasContent", () => {
  it("빈 원고는 false", () => {
    expect(hasContent(emptyBook())).toBe(false);
  });

  it("한 문장이라도 있으면 true", () => {
    expect(hasContent(bookWith({ "birth-1": "1970년 겨울에 태어났다." }))).toBe(true);
  });
});

describe("summaryLine", () => {
  it("글자수·쪽수·답변수를 담는다", () => {
    const line = summaryLine(bookWith({ "birth-1": "가".repeat(660) }));
    expect(line).toContain("660자");
    expect(line).toContain("1쪽");
    expect(line).toContain(`/ ${QUESTIONS.length}`);
  });
});

describe("buildDocxBlob — 실제 파일 생성", () => {
  /** 한글·특수문자·줄바꿈·긴 원고를 한꺼번에 넣은 검증용 원고. */
  function hardBook(): MemoirBook {
    return bookWith({
      "birth-1": "나는 1970년 겨울, 서울 은평구에서 태어났다.\n어머니는 그날 눈이 많이 왔다고 하셨다.",
      "birth-2": "처음 살던 집은 단독주택이었다. 대문이 있었고, 마당 왼쪽에 재래식 화장실이 있었다.",
      "childhood-1": "해질녘이 좋았다. 골목에 밥 짓는 냄새가 퍼지던 그 시간.",
      // 특수문자·따옴표·괄호·기호
      "school-4": '선생님이 "너는 커서 뭐가 될래?" 하고 물으셨다. <아무 말도> 못 했다. 100% 부끄러웠다. & 그 뒤로도 오래.',
      // 긴 원고 — 쪽 나눔 확인용
      "collapse-1": "그해 겨울은 길었다. ".repeat(400),
      // 다른 부(PART)에도 넣어 부마다 쪽이 나뉘는지 확인
      "legacy-12": "이 책을 읽는 당신에게.\n고맙습니다.",
    });
  }

  it("docx Blob을 만든다", async () => {
    const blob = await buildDocxBlob(hardBook(), FIXED);
    expect(blob.size).toBeGreaterThan(3000);
  });

  it("문서 XML에 한글 본문이 그대로 들어간다", async () => {
    const blob = await buildDocxBlob(hardBook(), FIXED);
    const buf = Buffer.from(await blob.arrayBuffer());

    // .docx는 ZIP이다. 앞 두 바이트가 PK여야 Word가 연다.
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");

    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file("word/document.xml")!.async("string");

    // 표지
    expect(xml).toContain("유리 벽돌을 쌓다");
    expect(xml).toContain("26년 공간 전문가의 기록");
    expect(xml).toContain("이대성 지음");
    expect(xml).toContain("2026-08-22 만듦");
    expect(xml).toContain(REVIEW_NOTICE);

    // 본문 — 한글이 그대로 살아 있어야 한다
    expect(xml).toContain("서울 은평구에서 태어났다");
    expect(xml).toContain("밥 짓는 냄새");
    expect(xml).toContain("고맙습니다");

    // 질문(소제목)도 들어간다
    expect(xml).toContain("당신이 태어난 날에 대해");

    // 장·부 제목
    expect(xml).toContain("태어난 자리");
    expect(xml).toContain("나의 뿌리");

    // 특수문자는 XML 이스케이프되어 깨지지 않는다
    expect(xml).toContain("&lt;아무 말도&gt;");
    expect(xml).toContain("&amp;");
    expect(xml).toContain("100%");

    // 글꼴 지정이 들어간다
    expect(xml).toContain("맑은 고딕");

    // 부가 바뀔 때 쪽을 넘긴다
    expect(xml).toContain("pageBreakBefore");
  });

  it("줄바꿈이 별개 문단으로 들어간다", async () => {
    const blob = await buildDocxBlob(
      bookWith({ "birth-1": "첫째 줄입니다.\n둘째 줄입니다." }),
      FIXED
    );
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(Buffer.from(await blob.arrayBuffer()));
    const xml = await zip.file("word/document.xml")!.async("string");

    // 두 줄이 각각 <w:t>로 들어가야 한다 (한 덩어리로 붙지 않는다)
    expect(xml).toContain("첫째 줄입니다.");
    expect(xml).toContain("둘째 줄입니다.");
    expect(xml).not.toContain("첫째 줄입니다.\n둘째 줄입니다.");
  });

  it("답이 없는 장은 문서에 넣지 않는다 — 없는 것을 채우지 않는다", async () => {
    const blob = await buildDocxBlob(bookWith({ "birth-1": "한 줄만 적었다." }), FIXED);
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(Buffer.from(await blob.arrayBuffer()));
    const xml = await zip.file("word/document.xml")!.async("string");

    expect(xml).toContain("태어난 자리");
    expect(xml).not.toContain("가장 어두웠던 때");
  });

  it("빈 원고여도 표지만 있는 문서가 나온다 — 오류가 나지 않는다", async () => {
    const blob = await buildDocxBlob(emptyBook(), FIXED);
    expect(blob.size).toBeGreaterThan(1000);
  });
});
