import { describe, it, expect } from "vitest";
import { oauthConfig, buildAuthUrl, fetchMemberProfile, redirectUriFor } from "./oauth";

const ok = (body: unknown) => ({ ok: true, json: async () => body });
const bad = (body: unknown) => ({ ok: false, json: async () => body });

describe("oauthConfig", () => {
  it("키가 없으면 null", () => {
    expect(oauthConfig("kakao", {})).toBeNull();
    expect(oauthConfig("naver", { GBRICK_NAVER_CLIENT_ID: "id" })).toBeNull();
  });
  it("기업 홈페이지용 NAVER_CLIENT_ID 는 쓰지 않는다", () => {
    expect(oauthConfig("naver", { NAVER_CLIENT_ID: "x", NAVER_CLIENT_SECRET: "y" })).toBeNull();
  });
  it("키가 있으면 반환", () => {
    expect(oauthConfig("kakao", { GBRICK_KAKAO_REST_API_KEY: "k" })).toEqual({ clientId: "k", clientSecret: null });
    expect(oauthConfig("naver", { GBRICK_NAVER_CLIENT_ID: "a", GBRICK_NAVER_CLIENT_SECRET: "b" })).toEqual({ clientId: "a", clientSecret: "b" });
  });
});

describe("주소", () => {
  it("개발자 콘솔에 등록한 Redirect URI 와 같다", () => {
    expect(redirectUriFor("kakao")).toBe("https://www.fobee.co.kr/api/gbrick/auth/kakao/callback");
    expect(redirectUriFor("naver")).toBe("https://www.fobee.co.kr/api/gbrick/auth/naver/callback");
  });
  it("로그인 시작 주소에 state 가 들어간다", () => {
    const u = new URL(buildAuthUrl("kakao", "S1", "https://x/cb", "KEY"));
    expect(u.origin + u.pathname).toBe("https://kauth.kakao.com/oauth/authorize");
    expect(u.searchParams.get("state")).toBe("S1");
    expect(u.searchParams.get("client_id")).toBe("KEY");
    expect(new URL(buildAuthUrl("naver", "S2", "https://x/cb", "N")).host).toBe("nid.naver.com");
  });
});

describe("프로필 받기", () => {
  it("카카오: 숫자 id 와 닉네임", async () => {
    const calls: string[] = [];
    const f = async (url: string) => { calls.push(url); return url.includes("oauth/token") ? ok({ access_token: "T" }) : ok({ id: 4012, kakao_account: { profile: { nickname: "대성" } } }); };
    expect(await fetchMemberProfile("kakao", "C", "S", "https://x/cb", { clientId: "K", clientSecret: "SEC" }, f)).toEqual({ providerUserId: "4012", nickname: "대성" });
    expect(calls).toHaveLength(2);
  });
  it("카카오: 토큰 실패는 예외", async () => {
    await expect(fetchMemberProfile("kakao", "C", "S", "u", { clientId: "K", clientSecret: null }, async () => bad({ error: "x" }))).rejects.toThrow();
  });
  it("네이버: id 와 이름", async () => {
    const f = async (url: string) => url.includes("oauth2.0/token") ? ok({ access_token: "T" }) : ok({ resultcode: "00", response: { id: "AbC", name: "이대성" } });
    expect(await fetchMemberProfile("naver", "C", "S", "u", { clientId: "a", clientSecret: "b" }, f)).toEqual({ providerUserId: "AbC", nickname: "이대성" });
  });
  it("네이버: resultcode 가 00 이 아니면 예외", async () => {
    const f = async (url: string) => url.includes("oauth2.0/token") ? ok({ access_token: "T" }) : ok({ resultcode: "024", response: {} });
    await expect(fetchMemberProfile("naver", "C", "S", "u", { clientId: "a", clientSecret: "b" }, f)).rejects.toThrow();
  });
});

import { isKakaoWebhookAuthorized } from "./oauth";

describe("카카오 연결 해제 웹훅 인증", () => {
  const env = { GBRICK_KAKAO_ADMIN_KEY: "admin-key-123" };
  it("KakaoAK + 어드민 키가 맞으면 통과", () => {
    expect(isKakaoWebhookAuthorized("KakaoAK admin-key-123", env)).toBe(true);
  });
  it("키가 다르거나 형식이 다르면 거절", () => {
    for (const h of ["KakaoAK wrong-key-1234", "admin-key-123", "Bearer admin-key-123", "KakaoAK admin-key-1234", "", null, undefined]) {
      expect(isKakaoWebhookAuthorized(h, env)).toBe(false);
    }
  });
  it("서버에 키가 없으면 무엇이든 거절 (빈 키로 통과 불가)", () => {
    expect(isKakaoWebhookAuthorized("KakaoAK ", {})).toBe(false);
    expect(isKakaoWebhookAuthorized("KakaoAK undefined", {})).toBe(false);
  });
});
