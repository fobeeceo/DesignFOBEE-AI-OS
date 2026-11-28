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

  it("앞글·부·장·뒷글을 모두 찾는다", () => {
    expect(units.map((u) => u.kind)).toEqual([
      "front", // 저자의 말
      "front", // 프롤로그
      "part", // PART ONE 속표지 (부제가 실려 있다)
      "chapter", // 제1장
      "chapter", // 제2장
      "part", // PART TWO 속표지
      "chapter", // 제3 장
      "back", // 에필로그
      "back", // 부록
    ]);
  });

  it("부 속표지의 글을 버리지 않는다 — 부제·연도·인용구가 실린다", () => {
    const p1 = units.find((u) => u.kind === "part" && u.part === "PART ONE")!;
    expect(p1.body).toContain("책상 하나, 그리고 첫 열매");
    const p2 = units.find((u) => u.kind === "part" && u.part === "PART TWO")!;
    expect(p2.body).toContain("멈춤과 비움, 그리고 새로운 바람");
  });

  it("속표지에 글이 없으면 빈 조각을 만들지 않는다", () => {
    const u = splitManuscript("PART ONE\n\n제1장\n시작\n\n본문.");
    expect(u.filter((x) => x.kind === "part")).toHaveLength(0);
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
    const i = units.findIndex((u) => u.id === "ch-1");
    expect(unitFileName(units[i], i)).toBe("04_ch-1_창업의 새벽, 카드론 천만 원.md");
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

/**
 * 2026-11 대표 원고(docx, 1·2권 분권본)에서 실제로 나온 형태.
 * 8월 PDF와 달리 장 제목이 한 줄에 붙어 있고, 장 안에 소제목이 많다.
 */
const DOCX_STYLE = `# 1권 편집 목차(가안)

- 저자의 말: 투명하게, 그러나 단단하게
- 1부 시작의 벽돌 — 제1~2장
- 2부 멈춤과 비움 — 제3~4장

# 저자의 말: 투명하게, 그러나 단단하게

이 책은 나의 고백이다.

# PART ONE

## 제1 장 창업의 새벽, 카드론 천만 원

### 기자촌, 서울의 끝에서 시작된 유년

연탄과 스티로폼의 기억이 있다.

### 손으로 배운 것들

도면을 혼자 익혔다.

# PART TWO

제3 장 거친 건축 현장에서의 고뇌

### 현장의 첫날

현장은 도면과 달랐다.

제20장  하나님 앞에서 부끄럽지 않은 경영자가 되기를

마지막 장입니다.`;

describe("splitManuscript — 2026-11 분권 docx 형식", () => {
  const units = splitManuscript(DOCX_STYLE);

  it("장 제목이 한 줄에 붙어 있어도 찾는다", () => {
    const ch = units.find((u) => u.subtitle === "거친 건축 현장에서의 고뇌")!;
    expect(ch.heading).toBe("제3 장");
    expect(ch.kind).toBe("chapter");
  });

  it("숫자와 '장' 사이에 공백이 없고 뒤에 공백이 둘이어도 찾는다", () => {
    const ch = units.find((u) => u.heading === "제20장")!;
    expect(ch.subtitle).toBe("하나님 앞에서 부끄럽지 않은 경영자가 되기를");
  });

  it("마크다운 제목이 붙은 장도 찾는다", () => {
    const ch = units.find((u) => u.heading === "제1 장")!;
    expect(ch.subtitle).toBe("창업의 새벽, 카드론 천만 원");
    expect(ch.part).toBe("PART ONE");
  });

  it("장 안의 소제목(###)을 장으로 보지 않는다 — 원고가 부서진다", () => {
    expect(units.some((u) => u.heading === "기자촌, 서울의 끝에서 시작된 유년")).toBe(false);
    const ch1 = units.find((u) => u.heading === "제1 장")!;
    expect(ch1.body).toContain("### 기자촌, 서울의 끝에서 시작된 유년");
    expect(ch1.body).toContain("### 손으로 배운 것들");
  });

  it("목차(가안)의 항목을 본문 구조로 착각하지 않는다", () => {
    // 목차는 '- '로 시작하는 목록이라 제목으로 잡히지 않는다.
    const 저자의말 = units.filter((u) => u.heading.startsWith("저자의 말"));
    expect(저자의말).toHaveLength(1);
    expect(저자의말[0].body).toContain("이 책은 나의 고백이다.");
  });

  it("목차의 '제1~2장' 표기를 장으로 잡지 않는다", () => {
    expect(units.filter((u) => u.kind === "chapter")).toHaveLength(3);
  });

  it("본문 문장이 장 제목으로 잘못 잡히지 않는다", () => {
    const u = splitManuscript(
      "제1장\n시작\n\n제3 장을 쓰면서 나는 오래 망설였고 그 시간이 길었다고 지금도 생각한다."
    );
    expect(u).toHaveLength(1);
    expect(u[0].body).toContain("제3 장을 쓰면서");
  });

  it("아주 긴 줄은 장 제목으로 보지 않는다", () => {
    const long = "제5 장 " + "가".repeat(80);
    const u = splitManuscript(`제1장\n시작\n\n${long}`);
    expect(u).toHaveLength(1);
    expect(u[0].body).toContain(long);
  });
});

describe("앞글·뒷글 제목 뒤에 말이 더 붙는 경우", () => {
  it("'부록 자료(편집 검토용)'을 부록으로 잡는다 — 에필로그에 흡수되면 안 된다", () => {
    const units = splitManuscript(
      "# 에필로그: 기억 속에 머무는 온기\n\n마지막 인사.\n\n# 부록 자료(편집 검토용)\n\n확인할 항목 목록."
    );
    expect(units).toHaveLength(2);
    expect(units[1].heading).toBe("부록 자료(편집 검토용)");
    expect(units[1].body).toContain("확인할 항목 목록.");
    expect(units[0].body).not.toContain("확인할 항목 목록.");
  });

  it("본문 한가운데의 긴 문장은 제목으로 잡지 않는다", () => {
    const long = "부록 에 실린 자료는 나중에 따로 정리하기로 하고 여기서는 넘어가기로 했다고 적어 둔다.";
    const units = splitManuscript(`제1장\n시작\n\n${long}`);
    expect(units).toHaveLength(1);
    expect(units[0].body).toContain(long);
  });
});
