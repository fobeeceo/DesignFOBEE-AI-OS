// 사장님 앱(POS) 서버 인증 — PIN을 맞히면 서명된 쿠키를 주고, 수정·삭제 요청에서 그 쿠키를 확인한다.
// 미들웨어(Edge)와 API 라우트 양쪽에서 쓰므로 Web Crypto 만 사용한다.

export const POS_COOKIE = "gbrick_pos_session";
export const POS_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;
export const POS_AUTH_ERROR = "새로고침 후 PIN을 다시 입력해 주세요";

export function posPin(): string {
  return process.env.GBRICK_POS_PIN ?? "1234";
}

// 서버 비밀값 + PIN 으로 서명한다 — PIN을 바꾸면 이전에 발급한 쿠키는 모두 무효가 된다
async function hmacKey(): Promise<CryptoKey> {
  const secret = `${process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}:${posPin()}`;
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

const payload = (expiresAt: number) => new TextEncoder().encode(`gbrick-pos:${expiresAt}`);
const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => new Uint8Array((hex.match(/../g) ?? []).map(h => parseInt(h, 16)));

export async function createPosSession(now = Date.now()): Promise<string> {
  const expiresAt = now + POS_SESSION_MAX_AGE_SEC * 1000;
  return `${expiresAt}.${toHex(await crypto.subtle.sign("HMAC", await hmacKey(), payload(expiresAt)))}`;
}

export async function verifyPosSession(value: string | undefined, now = Date.now()): Promise<boolean> {
  const match = /^(\d{1,16})\.([0-9a-f]{64})$/.exec(value ?? "");
  if (!match) return false;
  const expiresAt = Number(match[1]);
  if (expiresAt <= now) return false;
  return crypto.subtle.verify("HMAC", await hmacKey(), fromHex(match[2]), payload(expiresAt));
}

export const posCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: POS_SESSION_MAX_AGE_SEC,
};

/**
 * 이 요청에 무엇이 필요한가.
 *  - "pin": PIN 쿠키가 있어야 한다 (사장님 앱의 수정·삭제)
 *  - "pin-or-login": PIN 쿠키 또는 매장 직원 로그인 (주문 상태 변경 — 로그인하는 매장 대시보드도 쓴다)
 *  - "none": 누구나 (고객 앱이 쓰는 조회, PIN 입력 자체)
 */
export function posGateFor(method: string, pathname: string): "none" | "pin" | "pin-or-login" {
  if (/^\/api\/gbrick\/orders\/[^/]+\/status\/?$/.test(pathname)) return "pin-or-login";
  if (!pathname.startsWith("/api/gbrick/admin/")) return "none";
  const rest = pathname.slice("/api/gbrick/admin/".length).replace(/\/$/, "");
  if (rest === "pin") return "none";
  // 매장 좌표 채우기: 서버가 내부에서 호출한다 (알려진 좌표를 빈 칸에만 넣는다)
  if (rest === "geocode") return "none";
  // 조회(GET)인데 DB를 고치는 예외
  if (rest === "setup-store") return "pin";
  return method === "GET" || method === "HEAD" || method === "OPTIONS" ? "none" : "pin";
}
