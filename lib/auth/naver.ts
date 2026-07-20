/**
 * 네이버 로그인 유틸.
 * Supabase가 Naver를 기본 OAuth 프로바이더로 지원하지 않아
 * (참고: https://github.com/orgs/supabase/discussions/35631)
 * 네이버 OAuth 2.0을 직접 구현하고, 발급받은 프로필로 Supabase 세션을
 * Admin API(generateLink + verifyOtp)를 통해 발급한다.
 */

const NAVER_AUTH_URL = "https://nid.naver.com/oauth2.0/authorize";
const NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token";
const NAVER_PROFILE_URL = "https://openapi.naver.com/v1/nid/me";

export function getNaverAuthUrl(state: string, redirectUri: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.NAVER_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    state,
  });

  return `${NAVER_AUTH_URL}?${params.toString()}`;
}

interface NaverTokenResponse {
  access_token: string;
  error?: string;
  error_description?: string;
}

export async function exchangeNaverCode(code: string, state: string, redirectUri: string) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.NAVER_CLIENT_ID ?? "",
    client_secret: process.env.NAVER_CLIENT_SECRET ?? "",
    code,
    state,
    redirect_uri: redirectUri,
  });

  const res = await fetch(`${NAVER_TOKEN_URL}?${params.toString()}`);
  const data: NaverTokenResponse = await res.json();

  if (!res.ok || data.error || !data.access_token) {
    throw new Error(data.error_description ?? "네이버 토큰 발급에 실패했습니다.");
  }

  return data.access_token;
}

interface NaverProfileResponse {
  resultcode: string;
  message: string;
  response: {
    id: string;
    email?: string;
    name?: string;
    nickname?: string;
  };
}

export async function fetchNaverProfile(accessToken: string) {
  const res = await fetch(NAVER_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data: NaverProfileResponse = await res.json();

  if (data.resultcode !== "00") {
    throw new Error("네이버 프로필 조회에 실패했습니다.");
  }

  return data.response;
}
