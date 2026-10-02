/**
 * 음성 주문 — 사람 같은 목소리(클라우드 음성 합성) 서버 쪽 규칙.
 * 키가 없거나 한도를 넘으면 화면이 기기 기본 음성으로 되돌아가므로, 여기서는 "거절"을 정직하게 돌려주기만 한다.
 * ⚠️ API 키는 절대 로그·응답에 남기지 않는다.
 */

export const TTS_MAX_CHARS = 300;
/** 한 IP가 1분에 부를 수 있는 횟수(매장 와이파이 하나를 여러 손님이 써도 넉넉한 값). */
export const TTS_PER_IP_PER_MIN = 40;
/** 하루 합성 글자 수 상한 기본값. 넘으면 기기 음성으로 돌아간다(요금 폭주 방지). */
export const TTS_DEFAULT_DAILY_CHARS = 200_000;
export const TTS_DEFAULT_VOICE = "ko-KR-Chirp3-HD-Aoede";

export function cleanText(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const t = input.replace(/\s+/g, " ").trim();
  if (!t || t.length > TTS_MAX_CHARS) return null;
  return t;
}

type Bucket = { count: number; resetAt: number };

export function createLimiter(now: () => number = Date.now) {
  const perIp = new Map<string, Bucket>();
  let day = { chars: 0, resetAt: 0 };

  return {
    /** 허용되면 true. 글자 수도 함께 차감한다. */
    take(ip: string, chars: number, dailyCap: number): boolean {
      const t = now();
      if (t > day.resetAt) day = { chars: 0, resetAt: t + 24 * 60 * 60 * 1000 };
      const b = perIp.get(ip);
      if (!b || t > b.resetAt) perIp.set(ip, { count: 0, resetAt: t + 60_000 });
      const cur = perIp.get(ip)!;
      if (cur.count >= TTS_PER_IP_PER_MIN) return false;
      if (day.chars + chars > dailyCap) return false;
      cur.count += 1;
      day.chars += chars;
      return true;
    },
  };
}

/** 같은 문장은 다시 합성하지 않는다(인사말 같은 고정 문장이 많다). 작은 LRU. */
export function createCache<V>(max: number) {
  const m = new Map<string, V>();
  return {
    get(k: string): V | undefined {
      const v = m.get(k);
      if (v !== undefined) { m.delete(k); m.set(k, v); }
      return v;
    },
    set(k: string, v: V) {
      m.set(k, v);
      if (m.size > max) m.delete(m.keys().next().value as string);
    },
  };
}
