import { describe, expect, it } from "vitest";
import {
  countChars,
  splitManuscript,
  summarize,
  unitFileName,
} from "@/lib/publishing/manuscript";

/**
 * 시험 자료는 대표 원고 「유리 벽돌을 쌓다」 PDF에서 실제로 나온 형태를 그대로 쓴다.
 * `제3 장`처럼 숫자와 '장' 사이에 공백이 끼는 것은 PDF 글자 추출의 실제 결과다.
 */
const BOOK = `유리 벽돌을 쌓다
26년 공간 전문가의 투명한 기록
이대성 지음

저자의 말: 투명하게, 그러나 단단하게

이 책은 나의 고백이다.
성공 스토리를 쓰려던 것이 아니다.

프롤로그: 선(線) 하나가 세계를 바꾼다

나는 디자이너다. 선을 긋는 사람이다.

PART ONE
책상 하나, 그리고 첫 열매

제1장
창업의 새벽, 카드론 천만 원

2000년 10월 27일, 서울의 작은 사무실에서 나는 처음으로 "내 선"을 그었다.
친구에게 빌린 책상 위에서 시작했다.

제2장
12 시간의 사투, 성장의 파도

아침에 나가 자정에 들어왔다.

PART TWO
멈춤과 비움, 그리고 새로운 바람

제3 장
거친 건축 현장에서의 고뇌

현장은 도면과 달랐다.

에필로그: 기억 속에 머무는 온기

고맙습니다.

부록
공간 전문가의 창업 가이드

조명의 온도가 곧 공간의 온도다.`;

describe("splitManuscript", () => {
  const units = splitManuscript(BOOK);

  it("앞글·장·뒷글을 모두 찾는다", () => {
    expect(units.map((u) => u.kind)).toEqual([
      "front", // 저자의 말
      "front", // 프롤로그
      "chapter", // 제1장
      "chapter", // 제2장
      "chapter", // 제3 장
      "back", // 에필로그
      "back", // 부록
    ]);
  });

  it("장 번호 다음 줄을 부제로 가져온다", () => {
    const ch1 = units.find((u) => u.id === "ch-1")!;
    expect(ch1.heading).toBe("제1장");
    expect(ch1.subtitle).toBe("창업의 새벽, 카드론 천만 원");
  });

  it("숫자와 '장' 사이에 공백이 끼어도 찾는다 — PDF 추출의 실제 모습", () => {
    const ch3 = units.find((u) => u.id === "ch-3")!;
    expect(ch3.heading).toBe("제3 장");
    expect(ch3.subtitle).toBe("거친 건축 현장에서의 고뇌");
  });

  it("각 장이 어느 부에 속하는지 기록한다", () => {
    expect(units.find((u) => u.id === "ch-1")!.part).toBe("PART ONE");
    expect(units.find((u) => u.id === "ch-3")!.part).toBe("PART TWO");
  });

  it("부 제목 줄을 본문에 섞지 않는다", () => {
    for (const u of units) {
      expect(u.body).not.toContain("PART ONE");
      expect(u.body).not.toContain("PART TWO");
    }
  });

  it("본문을 그대로 옮긴다 — 글자를 바꾸지 않는다", () => {
    const ch1 = units.find((u) => u.id === "ch-1")!;
    expect(ch1.body).toContain('2000년 10월 27일, 서울의 작은 사무실에서 나는 처음으로 "내 선"을 그었다.');
    expect(ch1.body).toContain("친구에게 빌린 책상 위에서 시작했다.");
  });

  it("장 제목이 본문으로 새지 않는다", () => {
    const ch1 = units.find((u) => u.id === "ch-1")!;
    expect(ch1.body).not.toContain("제2장");
  });

  it("표지·판권 줄은 버린다 — 첫 제목 이전은 본문이 아니다", () => {
    for (const u of units) expect(u.body).not.toContain("이대성 지음");
  });
});

describe("splitManuscript — 다른 형식", () => {
  it("자서전 코너가 내보낸 마크다운도 받는다", () => {
    const md = `# 나의 기록

## PART ONE — 나의 뿌리

### 태어난 자리

**당신이 태어난 날에 대해 말씀해 주세요**

1970년 겨울에 태어났다.

### 자라난 골목

해질녘이 좋았다.`;
    const units = splitManuscript(md);
    expect(units).toHaveLength(2);
    expect(units[0].heading).toBe("태어난 자리");
    expect(units[0].part).toBe("PART ONE — 나의 뿌리");
    expect(units[1].body).toContain("해질녘이 좋았다.");
  });

  it("제목이 하나도 없으면 전체를 한 단위로 준다 — 빈 결과로 조용히 넘어가지 않는다", () => {
    const units = splitManuscript("그냥 쭉 이어 쓴 글입니다.\n제목이 없습니다.");
    expect(units).toHaveLength(1);
    expect(units[0].body).toContain("그냥 쭉 이어 쓴 글입니다.");
  });

  it("빈 원고는 빈 배열", () => {
    expect(splitManuscript("   \n\n  ")).toEqual([]);
  });

  it("부 구분이 없는 원고도 장을 찾는다", () => {
    const units = splitManuscript("제1장\n시작\n\n첫 문장.\n\n제2장\n다음\n\n둘째 문장.");
    expect(units).toHaveLength(2);
    expect(units[0].part).toBe("");
  });
});

describe("countChars", () => {
  it("공백을 한 칸으로 눌러 센다", () => {
    expect(countChars("가  나\n\n다")).toBe(5);
  });

  it("공백만 있으면 0", () => {
    expect(countChars("  \n ")).toBe(0);
  });
});

describe("summarize", () => {
  const units = splitManuscript(BOOK);
  const s = summarize(units);

  it("장 수와 부 목록을 센다", () => {
    expect(s.chapters).toBe(3);
    expect(s.parts).toEqual(["PART ONE", "PART TWO"]);
  });

  it("단위별 글자수 합이 전체와 같다", () => {
    expect(units.reduce((a, u) => a + u.chars, 0)).toBe(s.chars);
  });

  it("본문이 너무 짧은 장을 짚어낸다 — 분해가 잘못됐을 수 있다", () => {
    expect(s.thin.length).toBeGreaterThan(0);
    expect(s.thin.every((t) => t.chars < 200)).toBe(true);
  });

  it("기준을 낮추면 짧은 장 목록이 줄어든다", () => {
    expect(summarize(units, 1).thin).toHaveLength(0);
  });
});

describe("unitFileName", () => {
  const units = splitManuscript(BOOK);

  it("순서 번호 + id + 제목으로 만든다", () => {
    expect(unitFileName(units[2], 2)).toBe("03_ch-1_창업의 새벽, 카드론 천만 원.md");
  });

  it("부제가 없으면 제목을 쓴다", () => {
    const u = { ...units[0], subtitle: "" };
    expect(unitFileName(u, 0)).toContain("저자의 말");
  });

  it("파일명에 쓸 수 없는 문자를 걷어낸다", () => {
    const u = { ...units[0], subtitle: '나의 삶: 1부/2부 <초안>?' };
    expect(unitFileName(u, 0)).toBe("01_front-1_나의 삶 1부2부 초안.md");
  });

  it("제목이 비면 '무제'로 둔다 — 지어내지 않는다", () => {
    const u = { ...units[0], heading: "", subtitle: "" };
    expect(unitFileName(u, 0)).toBe("01_front-1_무제.md");
  });
});
