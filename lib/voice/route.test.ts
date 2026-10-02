import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/voice/tts/route";

const req = (body: unknown, origin: string | null = "https://x.test") =>
  new NextRequest("https://x.test/api/voice/tts", {
    method: "POST",
    headers: { host: "x.test", "content-type": "application/json", ...(origin ? { origin } : {}) },
    body: JSON.stringify(body),
  });

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("/api/voice/tts", () => {
  it("키가 없으면 켜져 있지 않다고 알리고 503을 돌려준다", async () => {
    vi.stubEnv("GOOGLE_TTS_API_KEY", "");
    expect((await (await GET()).json()).ok).toBe(false);
    expect((await POST(req({ text: "안녕하세요" }))).status).toBe(503);
  });

  it("다른 사이트에서 온 요청은 막는다", async () => {
    vi.stubEnv("GOOGLE_TTS_API_KEY", "k");
    expect((await POST(req({ text: "안녕하세요" }, "https://evil.test"))).status).toBe(403);
    expect((await POST(req({ text: "안녕하세요" }, null))).status).toBe(403);
  });

  it("너무 긴 문장은 거절하고, 정상 요청은 음성을 돌려주며 같은 문장은 다시 합성하지 않는다", async () => {
    vi.stubEnv("GOOGLE_TTS_API_KEY", "secret-key");
    expect((await POST(req({ text: "가".repeat(400) }))).status).toBe(400);
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ audioContent: Buffer.from("mp3").toString("base64") })));
    vi.stubGlobal("fetch", f);
    const r1 = await POST(req({ text: "어서 오세요! 오늘은 어떤 걸로 드릴까요?" }));
    expect(r1.status).toBe(200);
    expect(r1.headers.get("content-type")).toBe("audio/mpeg");
    const r2 = await POST(req({ text: "어서 오세요! 오늘은 어떤 걸로 드릴까요?" }));
    expect(r2.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][1].headers["x-goog-api-key"]).toBe("secret-key");
  });

  it("상대 서비스가 실패하면 502를 돌려주고 키를 응답에 싣지 않는다", async () => {
    vi.stubEnv("GOOGLE_TTS_API_KEY", "secret-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 403 })));
    const r = await POST(req({ text: "다른 문장이에요" }));
    expect(r.status).toBe(502);
    expect(JSON.stringify(await r.json())).not.toContain("secret-key");
  });
});
