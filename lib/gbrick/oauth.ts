// 카카오·네이버 로그인 — 주소 만들기 + 로그인한 사람의 고유번호·닉네임 받기
// 기업 홈페이지의 네이버 로그인(lib/auth/naver.ts, NAVER_CLIENT_ID)과는 다른 앱이므로 환경변수 이름이 다르다.

import { SITE_URL } from "@/lib/site";
import { cleanNickname, type MemberProvider } from "./member";

export interface OAuthConfig { clientId: string; clientSecret: string | null; }
export interface MemberProfile { providerUserId: string; nickname: string; }

type Env = Record<string, string | undefined>;
type FetchLike = (input: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

export function oauthConfig(provider: MemberProvider, env: Env = process.env): OAuthConfig | null {
  if (provider === "kakao") {
    const clientId = env.GBRICK_KAKAO_REST_API_KEY;
    return clientId ? { clientId, clientSecret: env.GBRICK_KAKAO_CLIENT_SECRET || null } : null;
  }
  const clientId = env.GBRICK_NAVER_CLIENT_ID;
  const clientSecret = env.GBRICK_NAVER_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/** 개발자 콘솔에 등록한 Redirect URI 와 한 글자도 달라서는 안 된다 */
export const redirectUriFor = (provider: MemberProvider) => `${SITE_URL}/api/gbrick/auth/${provider}/callback`;

export function buildAuthUrl(provider: MemberProvider, state: string, redirectUri: string, clientId: string): string {
  const base = provider === "kakao" ? "https://kauth.kakao.com/oauth/authorize" : "https://nid.naver.com/oauth2.0/authorize";
  return `${base}?${new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri, state })}`;
}

const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

export async function fetchMemberProfile(
  provider: MemberProvider, code: string, state: string, redirectUri: string, cfg: OAuthConfig, fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<MemberProfile> {
  if (provider === "kakao") {
    const form = new URLSearchParams({ grant_type: "authorization_code", client_id: cfg.clientId, redirect_uri: redirectUri, code });
    if (cfg.clientSecret) form.set("client_secret", cfg.clientSecret);
    const tokenRes = await fetchImpl("https://kauth.kakao.com/oauth/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" }, body: form.toString(),
    });
    const token = asRecord(await tokenRes.json());
    if (!tokenRes.ok || typeof token.access_token !== "string") throw new Error("카카오 토큰 발급 실패");

    const meRes = await fetchImpl("https://kapi.kakao.com/v2/user/me", { headers: { Authorization: `Bearer ${token.access_token}` } });
    const me = asRecord(await meRes.json());
    if (!meRes.ok || (typeof me.id !== "number" && typeof me.id !== "string")) throw new Error("카카오 프로필 조회 실패");
    const profile = asRecord(asRecord(me.kakao_account).profile);
    return { providerUserId: String(me.id), nickname: cleanNickname(profile.nickname ?? asRecord(me.properties).nickname) };
  }

  const params = new URLSearchParams({ grant_type: "authorization_code", client_id: cfg.clientId, client_secret: cfg.clientSecret ?? "", code, state });
  const tokenRes = await fetchImpl(`https://nid.naver.com/oauth2.0/token?${params}`);
  const token = asRecord(await tokenRes.json());
  if (!tokenRes.ok || typeof token.access_token !== "string") throw new Error("네이버 토큰 발급 실패");

  const meRes = await fetchImpl("https://openapi.naver.com/v1/nid/me", { headers: { Authorization: `Bearer ${token.access_token}` } });
  const me = asRecord(await meRes.json());
  const user = asRecord(me.response);
  if (!meRes.ok || me.resultcode !== "00" || typeof user.id !== "string") throw new Error("네이버 프로필 조회 실패");
  return { providerUserId: user.id, nickname: cleanNickname(user.name ?? user.nickname) };
}
