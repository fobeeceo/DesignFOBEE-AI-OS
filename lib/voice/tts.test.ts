import { describe, it, expect } from "vitest";
import { TTS_MAX_CHARS, TTS_PER_IP_PER_MIN, cleanText, createCache, createLimiter } from "./tts";

describe("음성 합성 서버 규칙", () => {
  it("빈 문장·너무 긴 문장·문자열이 아닌 값은 거절한다", () => {
    expect(cleanText("")).toBeNull();
    expect(cleanText("   ")).toBeNull();
    expect(cleanText(123)).toBeNull();
    expect(cleanText("가".repeat(TTS_MAX_CHARS + 1))).toBeNull();
    expect(cleanText("  어서   오세요! ")).toBe("어서 오세요!");
  });

  it("한 IP가 1분에 부를 수 있는 횟수를 넘기면 거절하고, 1분 뒤에는 다시 허용한다", () => {
    let t = 0;
    const l = createLimiter(() => t);
    for (let i = 0; i < TTS_PER_IP_PER_MIN; i++) expect(l.take("a", 10, 1e9)).toBe(true);
    expect(l.take("a", 10, 1e9)).toBe(false);
    expect(l.take("b", 10, 1e9)).toBe(true); // 다른 IP는 영향 없음
    t += 61_000;
    expect(l.take("a", 10, 1e9)).toBe(true);
  });

  it("하루 글자 수 상한을 넘기면 거절한다(요금 폭주 방지)", () => {
    const l = createLimiter(() => 0);
    expect(l.take("a", 60, 100)).toBe(true);
    expect(l.take("b", 60, 100)).toBe(false);
    expect(l.take("b", 40, 100)).toBe(true);
  });

  it("캐시는 가장 오래 안 쓴 것부터 버린다", () => {
    const c = createCache<number>(2);
    c.set("a", 1); c.set("b", 2); c.get("a"); c.set("c", 3);
    expect(c.get("b")).toBeUndefined();
    expect(c.get("a")).toBe(1);
  });
});
