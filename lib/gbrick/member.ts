// 고객 앱 회원 로그인 — 카카오·네이버로 로그인하면 서명된 쿠키를 준다 (2026-11-18)
// 서버 라우트에서만 쓴다. Web Crypto 만 사용해 Node·Edge 어디서든 같은 결과가 나온다.

export const MEMBER_COOKIE = "gbrick_member";
export const MEMBER_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 60; // 60일

export type MemberProvider = "kakao" | "naver";
export const MEMBER_PROVIDERS: readonly MemberProvider[] = ["kakao", "naver"];

export const isMemberProvider = (value: unknown): value is MemberProvider =>
  typeof value === "string" && (MEMBER_PROVIDERS as readonly string[]).includes(value);

// 회원 번호 = "카카오_12345" 처럼 로그인 수단 + 그 서비스가 준 고유번호.
// 같은 사람이 카카오와 네이버로 따로 가입하면 별개 회원이다 (전화번호 없이는 합칠 수 없다).
const MEMBER_ID = /^(kakao|naver)_[A-Za-z0-9_-]{1,64}$/;

export function memberIdFor(provider: MemberProvider, providerUserId: string): string | null {
  const id = `${provider}_${providerUserId}`;
  return MEMBER_ID.test(id) ? id : null;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = `${process.env.GBRICK_MEMBER_SECRET ?? ""}:${process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`;
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

const payload = (memberId: string, expiresAt: number) => new TextEncoder().encode(`gbrick-member:${memberId}:${expiresAt}`);
const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => new Uint8Array((hex.match(/../g) ?? []).map(h => parseInt(h, 16)));

export async function createMemberSession(memberId: string, now = Date.now()): Promise<string> {
  const expiresAt = now + MEMBER_SESSION_MAX_AGE_SEC * 1000;
  return `${memberId}.${expiresAt}.${toHex(await crypto.subtle.sign("HMAC", await hmacKey(), payload(memberId, expiresAt)))}`;
}

/** 쿠키가 우리가 발급한 것이고 만료 전이면 회원 번호를, 아니면 null 을 돌려준다 */
export async function verifyMemberSession(value: string | undefined, now = Date.now()): Promise<string | null> {
  const match = /^([A-Za-z0-9_-]{1,80})\.(\d{1,16})\.([0-9a-f]{64})$/.exec(value ?? "");
  if (!match) return null;
  const [, memberId, exp, sig] = match;
  if (!MEMBER_ID.test(memberId) || Number(exp) <= now) return null;
  const ok = await crypto.subtle.verify("HMAC", await hmacKey(), fromHex(sig), payload(memberId, Number(exp)));
  return ok ? memberId : null;
}

export const memberCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MEMBER_SESSION_MAX_AGE_SEC,
};

/** 로그인 뒤 돌아갈 곳 — 우리 앱(/gbrick…) 안으로만 허용한다 (열린 리다이렉트 방지) */
export function safeNext(value: string | null | undefined): string {
  const fallback = "/gbrick/mypage";
  if (!value || !value.startsWith("/gbrick") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return fallback;
  if (value !== "/gbrick" && !value.startsWith("/gbrick/") && !value.startsWith("/gbrick?")) return fallback;
  return value;
}

/** 로그인할 때 고객에게 보여 줄 이름 — 제어문자를 지우고 20자까지 */
export function cleanNickname(value: unknown): string {
  if (typeof value !== "string") return "고객";
  const text = value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, " ").replace(/\s+/g, " ").trim().slice(0, 20);
  return text || "고객";
}
