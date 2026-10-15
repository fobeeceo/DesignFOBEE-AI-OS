import { describe, expect, it } from "vitest";
import { brandRedirectUrl, brandRoute, isBrandHost } from "./brandDomain";

describe("isBrandHost", () => {
  it("GBRICK 도메인만 잡는다", () => {
    expect(isBrandHost("www.gbrickcoffee.com")).toBe(true);
    expect(isBrandHost("GBRICKCOFFEE.CO.KR:443")).toBe(true);
    expect(isBrandHost("www.fobee.co.kr")).toBe(false);
    expect(isBrandHost(null)).toBe(false);
  });
});

describe("brandRedirectUrl", () => {
  const site = "https://www.fobee.co.kr";

  it("첫 화면은 가맹 페이지로, 꼬리표가 없으면 도메인 유입으로 표시한다", () => {
    expect(brandRedirectUrl("/", "", site)).toBe(
      "https://www.fobee.co.kr/franchise?utm_source=gbrickcoffee_domain"
    );
  });

  it("기존 꼬리표는 그대로 넘긴다", () => {
    expect(brandRedirectUrl("/", "?utm_source=tiktok&utm_medium=short_video", site)).toBe(
      "https://www.fobee.co.kr/franchise?utm_source=tiktok&utm_medium=short_video"
    );
  });

  it("다른 경로는 같은 경로로 보낸다", () => {
    expect(brandRedirectUrl("/franchise/diagnosis", "", site)).toBe(
      "https://www.fobee.co.kr/franchise/diagnosis?utm_source=gbrickcoffee_domain"
    );
  });
});

describe("brandRoute", () => {
  const site = "https://www.fobee.co.kr";

  it("첫 화면은 주소를 그대로 두고 가맹 페이지를 보여준다", () => {
    expect(brandRoute("/", "?utm_source=tiktok", site)).toEqual({ kind: "rewrite", pathname: "/franchise" });
  });

  it("가맹 페이지가 쓰는 경로는 그대로 둔다", () => {
    for (const path of ["/franchise", "/franchise/diagnosis", "/api/leads", "/privacy", "/og-image.jpg", "/robots.txt"]) {
      expect(brandRoute(path, "", site)).toEqual({ kind: "pass" });
    }
  });

  it("회사 홈페이지 경로는 fobee.co.kr로 보낸다", () => {
    expect(brandRoute("/design", "", site)).toEqual({
      kind: "redirect",
      url: "https://www.fobee.co.kr/design?utm_source=gbrickcoffee_domain",
    });
    expect(brandRoute("/franchisex", "", site).kind).toBe("redirect");
  });
});
