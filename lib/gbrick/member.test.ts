import { describe, it, expect, beforeEach } from "vitest";
import { createMemberSession, verifyMemberSession, memberIdFor, safeNext, cleanNickname } from "./member";

beforeEach(() => { process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY = "test-service-key"; });

describe("회원 세션 쿠키", () => {
  it("발급한 쿠키는 회원 번호로 되돌려진다", async () => {
    const cookie = await createMemberSession("kakao_123");
    expect(await verifyMemberSession(cookie)).toBe("kakao_123");
  });
  it("만료된 쿠키는 거절한다", async () => {
    const cookie = await createMemberSession("kakao_123", Date.now() - 1000 * 60 * 60 * 24 * 61);
    expect(await verifyMemberSession(cookie)).toBeNull();
  });
  it("회원 번호를 바꿔치기하면 거절한다", async () => {
    const [, exp, sig] = (await createMemberSession("kakao_123")).split(".");
    expect(await verifyMemberSession(`kakao_999.${exp}.${sig}`)).toBeNull();
  });
  it("서명을 한 글자 바꾸면 거절한다", async () => {
    const cookie = await createMemberSession("naver_abc");
    const bad = cookie.slice(0, -1) + (cookie.endsWith("0") ? "1" : "0");
    expect(await verifyMemberSession(bad)).toBeNull();
  });
  it("서버 비밀값이 다르면 거절한다", async () => {
    const cookie = await createMemberSession("kakao_123");
    process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY = "other-key";
    expect(await verifyMemberSession(cookie)).toBeNull();
  });
  it("엉뚱한 값·빈 값은 거절한다", async () => {
    for (const v of [undefined, "", "abc", "kakao_1.2.3", "../x.9999999999999.00"]) expect(await verifyMemberSession(v)).toBeNull();
  });
});

describe("회원 번호", () => {
  it("로그인 수단과 고유번호를 합친다", () => {
    expect(memberIdFor("kakao", "4012345678")).toBe("kakao_4012345678");
    expect(memberIdFor("naver", "AbC-d_9")).toBe("naver_AbC-d_9");
  });
  it("이상한 문자가 있으면 만들지 않는다", () => {
    expect(memberIdFor("kakao", "1; drop")).toBeNull();
    expect(memberIdFor("naver", "")).toBeNull();
  });
});

describe("로그인 뒤 이동 경로", () => {
  it("앱 안 경로만 허용한다", () => {
    expect(safeNext("/gbrick/cart")).toBe("/gbrick/cart");
    expect(safeNext("/gbrick")).toBe("/gbrick");
  });
  it("바깥 주소·우회 시도는 기본값으로", () => {
    for (const v of ["https://evil.com", "//evil.com", "/gbrickx", "/evil", "/gbrick/\\evil", "", null, undefined]) {
      expect(safeNext(v)).toBe("/gbrick/mypage");
    }
  });
});

describe("닉네임 정리", () => {
  it("제어문자를 지우고 20자로 자른다", () => {
    expect(cleanNickname("홍\u001b길\n동")).toBe("홍 길 동");
    expect(cleanNickname("가".repeat(50))).toHaveLength(20);
  });
  it("비어 있으면 '고객'", () => {
    expect(cleanNickname(undefined)).toBe("고객");
    expect(cleanNickname("   ")).toBe("고객");
  });
});
