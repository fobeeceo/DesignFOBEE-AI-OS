import { describe, expect, it } from "vitest";
import { MEMOIR_DAILY_IP_LIMIT } from "@/lib/constants";
import { checkIpUsage, consumeIpUsage, ipFrom } from "@/lib/memoir/ai";

describe("ipFrom", () => {
  it("x-forwarded-for의 첫 주소를 쓴다", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(ipFrom(h)).toBe("1.2.3.4");
  });

  it("헤더가 없으면 로컬로 본다", () => {
    expect(ipFrom(new Headers())).toBe("127.0.0.1");
  });
});

describe("하루 무료 횟수", () => {
  it("처음 오는 IP는 전량 남아 있다", () => {
    const r = checkIpUsage("test-fresh");
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(MEMOIR_DAILY_IP_LIMIT);
  });

  it("쓸 때마다 하나씩 준다", () => {
    checkIpUsage("test-count");
    expect(consumeIpUsage("test-count")).toBe(MEMOIR_DAILY_IP_LIMIT - 1);
    expect(consumeIpUsage("test-count")).toBe(MEMOIR_DAILY_IP_LIMIT - 2);
    expect(checkIpUsage("test-count").remaining).toBe(MEMOIR_DAILY_IP_LIMIT - 2);
  });

  it("다 쓰면 막고, 남은 횟수는 음수로 내려가지 않는다", () => {
    checkIpUsage("test-exhaust");
    for (let i = 0; i < MEMOIR_DAILY_IP_LIMIT + 3; i++) consumeIpUsage("test-exhaust");
    const r = checkIpUsage("test-exhaust");
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("IP끼리 서로 영향을 주지 않는다", () => {
    checkIpUsage("test-a");
    consumeIpUsage("test-a");
    expect(checkIpUsage("test-b").remaining).toBe(MEMOIR_DAILY_IP_LIMIT);
  });
});

describe("다듬는 방식", () => {
  it("세 가지가 모두 이름과 지시를 가진다", async () => {
    const { POLISH_TONES, POLISH_TONE_LABEL, POLISH_TONE_RULE } = await import(
      "@/lib/memoir/tone"
    );
    expect(POLISH_TONES).toHaveLength(3);
    for (const t of POLISH_TONES) {
      expect(POLISH_TONE_LABEL[t].name.length).toBeGreaterThan(0);
      expect(POLISH_TONE_RULE[t].length).toBeGreaterThan(20);
    }
  });
});
