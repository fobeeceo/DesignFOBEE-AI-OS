import { describe, expect, it } from "vitest";
import {
  attributionTags,
  buildChannelLink,
  cleanAttribution,
  describeAttribution,
  parseAttribution,
} from "./attribution";

describe("parseAttribution", () => {
  it("utm 꼬리표를 읽는다", () => {
    const a = parseAttribution(
      "?utm_source=TikTok&utm_medium=short_video&utm_campaign=franchise_organic&utm_content=2610_storefront",
      "",
      "www.fobee.co.kr"
    );
    expect(a).toEqual({
      source: "tiktok",
      medium: "short_video",
      campaign: "franchise_organic",
      content: "2610_storefront",
    });
  });

  it("꼬리표가 없으면 referrer로 채널을 추정하고 경로는 버린다", () => {
    const a = parseAttribution("", "https://m.blog.naver.com/gbrick/123?q=개인", "www.fobee.co.kr");
    expect(a).toEqual({ source: "naver_blog", referrer: "m.blog.naver.com" });
  });

  it("같은 사이트 안 이동이나 단서 없음은 undefined", () => {
    expect(parseAttribution("", "https://www.fobee.co.kr/", "www.fobee.co.kr")).toBeUndefined();
    expect(parseAttribution("", "", "www.fobee.co.kr")).toBeUndefined();
  });

  it("위험한 문자와 긴 값은 정리한다", () => {
    const a = cleanAttribution({ source: "<script>alert(1)</script>" + "x".repeat(100) });
    expect(a?.source).toMatch(/^[a-z0-9가-힣_.-]+$/);
    expect(a!.source!.length).toBeLessThanOrEqual(50);
  });
});

describe("attributionTags", () => {
  it("CRM 태그로 바꾼다", () => {
    expect(attributionTags({ source: "youtube", medium: "shorts", campaign: "franchise_organic" })).toEqual([
      "유입:youtube",
      "매체:shorts",
      "캠페인:franchise_organic",
    ]);
  });

  it("단서가 없으면 미확인", () => {
    expect(attributionTags(undefined)).toEqual(["유입:미확인"]);
  });
});

describe("describeAttribution / buildChannelLink", () => {
  it("메일 한 줄 요약", () => {
    expect(describeAttribution({ source: "naver_blog", referrer: "m.blog.naver.com" })).toBe(
      "naver_blog / (m.blog.naver.com)"
    );
  });

  it("채널 링크를 만든다", () => {
    expect(buildChannelLink("https://www.fobee.co.kr", "instagram", "reels", "franchise_organic", "v01")).toBe(
      "https://www.fobee.co.kr/franchise?utm_source=instagram&utm_medium=reels&utm_campaign=franchise_organic&utm_content=v01"
    );
  });
});
