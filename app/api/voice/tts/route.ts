import { NextRequest, NextResponse } from "next/server";
import {
  TTS_DEFAULT_DAILY_CHARS,
  TTS_DEFAULT_VOICE,
  cleanText,
  createCache,
  createLimiter,
} from "@/lib/voice/tts";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * 음성 주문의 "사람 같은 목소리". 키(GOOGLE_TTS_API_KEY)가 없으면 503을 돌려주고,
 * 화면은 기기 기본 음성으로 자동 전환한다. 키는 대표님이 호스팅 환경변수에 직접 넣는다.
 */
const limiter = createLimiter();
const cache = createCache<Buffer>(200);

function ipFrom(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
}

/** 우리 사이트 화면에서 온 요청만 받는다(남이 내 합성 요금을 쓰지 못하게). */
function sameSite(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

/** 켜져 있는지만 알려 준다(키 값은 알려 주지 않는다). */
export async function GET() {
  return NextResponse.json({ ok: Boolean(process.env.GOOGLE_TTS_API_KEY) });
}

export async function POST(req: NextRequest) {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "NO_KEY" }, { status: 503 });
  if (!sameSite(req)) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  let text: string | null = null;
  try {
    text = cleanText((await req.json())?.text);
  } catch {
    text = null;
  }
  if (!text) return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });

  const voice = process.env.VOICE_TTS_VOICE || TTS_DEFAULT_VOICE;
  const cacheKey = `${voice}|${text}`;
  const hit = cache.get(cacheKey);
  if (hit) return audio(hit);

  const cap = Number(process.env.VOICE_TTS_DAILY_CHARS) || TTS_DEFAULT_DAILY_CHARS;
  if (!limiter.take(ipFrom(req.headers), text.length, cap)) {
    return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 });
  }

  try {
    const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "ko-KR", name: voice },
        audioConfig: { audioEncoding: "MP3" },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: "UPSTREAM", status: r.status }, { status: 502 });
    const data = (await r.json()) as { audioContent?: string };
    if (!data.audioContent) return NextResponse.json({ ok: false, error: "UPSTREAM" }, { status: 502 });
    const buf = Buffer.from(data.audioContent, "base64");
    cache.set(cacheKey, buf);
    return audio(buf);
  } catch {
    return NextResponse.json({ ok: false, error: "UPSTREAM" }, { status: 502 });
  }
}

function audio(buf: Buffer) {
  return new NextResponse(new Uint8Array(buf), {
    headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=3600" },
  });
}
