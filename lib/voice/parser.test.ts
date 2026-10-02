import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

// 브라우저용 파일(public/voice/parser.js)을 그대로 불러와 시험한다. 같은 코드를 두 벌 만들지 않기 위해서다(§14-A ⑥).
const require = createRequire(import.meta.url);
const P = require("../../public/voice/parser.js");
const menu = require("../../public/voice/menu.json");

const say = (t: string) => P.describe(P.parseOrder(t, menu).items);

describe("음성 주문 해석기 (실제 메뉴)", () => {
  it("온도·수량·접속어를 알아듣는다", () => {
    expect(say("아이스 아메리카노 한 잔 주세요")).toBe("시원한 아메리카노 (스페셜티) 한 잔");
    expect(say("따뜻한 카페라떼 하나랑 아이스 아메리카노 하나")).toBe("따뜻한 카페라떼 한 잔, 시원한 아메리카노 (스페셜티) 한 잔");
    expect(say("아아 두 개 주세요")).toBe("시원한 아메리카노 (스페셜티) 두 잔");
  });

  it("음성 인식이 흔히 틀리는 철자('라테', '아메리카 노')를 알아듣는다", () => {
    expect(say("라테 한 잔")).toBe("따뜻한 카페라떼 한 잔");
    expect(say("아메리카 노 하나")).toBe("따뜻한 아메리카노 (스페셜티) 한 잔");
    expect(say("카푸치노 두잔")).toBe("따뜻한 카푸치노 두 잔");
  });

  it("없는 온도는 있는 온도로 바꾸고 손님께 알린다", () => {
    const r = P.parseOrder("딸기 라떼 따뜻하게", menu);
    expect(P.describe(r.items)).toBe("시원한 딸기 라떼 한 잔");
    expect(r.notes[0]).toContain("시원한 것만");
  });

  it("메뉴에 없는 말·모호한 말은 지어내지 않는다", () => {
    expect(P.parseOrder("플랫화이트", menu).items).toHaveLength(0);
    expect(P.parseOrder("커피 한 잔", menu).items).toHaveLength(0);
  });

  it("'하나 더'는 방금 메뉴를 더 담는 말로, '추가'만은 그렇지 않게 본다", () => {
    expect(P.parseOrder("하나 더 주세요", menu).repeat).toBe(1);
    expect(P.parseOrder("두 잔 더요", menu).repeat).toBe(2);
    expect(P.parseOrder("똑같은 걸로 하나 더", menu).repeat).toBe(1);
    expect(P.parseOrder("추가", menu).repeat).toBe(0);
  });

  it("확인 단계의 말을 구분한다", () => {
    expect(P.parseIntent("네 맞아요")).toBe("yes");
    expect(P.parseIntent("그게 다예요")).toBe("yes");
    expect(P.parseIntent("없어요")).toBe("yes");
    expect(P.parseIntent("추가요")).toBe("more");
    expect(P.parseIntent("더 있어요")).toBe("more");
    expect(P.parseIntent("아니요")).toBe("no");
    expect(P.parseIntent("빼 주세요")).toBe("remove");
    expect(P.parseIntent("직원 불러 주세요")).toBe("staff");
  });
});
