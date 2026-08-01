import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  escapeHtml,
  parseRecipients,
  buildSubject,
  buildHtml,
  buildText,
  sendLeadNotification,
} from "./leadEmail";
import type { CreateLeadInput } from "@/types/lead";

const BASE_INPUT: CreateLeadInput = {
  name: "홍길동",
  phone: "010-1234-5678",
  source: "franchise_page",
  email: "test@example.com",
  message: "가맹 상담 문의드립니다.",
};

describe("escapeHtml", () => {
  it("HTML 특수문자를 이스케이프해 태그 주입을 막는다", () => {
    const out = escapeHtml('<script>alert("x")</script>');

    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
    expect(out).toContain("&quot;");
  });
});

describe("parseRecipients", () => {
  it("쉼표로 여러 수신자를 분리하고 공백을 제거한다", () => {
    expect(parseRecipients("a@x.com, b@x.com ,c@x.com")).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
    ]);
  });

  it("미설정이면 빈 배열을 반환한다", () => {
    expect(parseRecipients(undefined)).toEqual([]);
    expect(parseRecipients("")).toEqual([]);
  });
});

describe("buildSubject", () => {
  it("저장 성공 시 일반 제목을 만든다", () => {
    const s = buildSubject(BASE_INPUT, { saved: true });

    expect(s).toBe("[상담신청] 홍길동 / 010-1234-5678 (franchise_page)");
  });

  it("저장 실패 시 경고 제목을 만든다", () => {
    const s = buildSubject(BASE_INPUT, { saved: false });

    expect(s).toContain("DB실패");
    expect(s).toContain("홍길동");
  });
});

describe("buildText / buildHtml", () => {
  it("저장 실패 메일에는 삭제 금지 경고가 들어간다", () => {
    const ctx = { saved: false, failureReason: "connection refused" };

    expect(buildText(BASE_INPUT, ctx)).toContain("유일한 기록이니 삭제하지 마세요");
    expect(buildHtml(BASE_INPUT, ctx)).toContain("유일한 기록이니 삭제하지 마세요");
    expect(buildText(BASE_INPUT, ctx)).toContain("connection refused");
  });

  it("입력한 상담 내용이 본문에 그대로 담긴다", () => {
    const text = buildText(BASE_INPUT, { saved: true, referenceNo: "GBR-20260731-0001" });

    expect(text).toContain("홍길동");
    expect(text).toContain("010-1234-5678");
    expect(text).toContain("가맹 상담 문의드립니다.");
    expect(text).toContain("GBR-20260731-0001");
  });

  it("HTML 본문에서 사용자 입력이 이스케이프된다", () => {
    const html = buildHtml(
      { ...BASE_INPUT, name: '<img src=x onerror="alert(1)">' },
      { saved: true }
    );

    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });
});

describe("sendLeadNotification", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("API 키가 없으면 발송하지 않고 false를 반환한다(무파괴)", async () => {
    delete process.env.RESEND_API_KEY;
    process.env.LEAD_NOTIFY_TO = "ceo@fobee.co.kr";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await sendLeadNotification(BASE_INPUT, { saved: true });

    expect(result).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("발송 성공 시 true를 반환하고 Resend로 POST 한다", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.LEAD_NOTIFY_TO = "ceo@fobee.co.kr";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    const result = await sendLeadNotification(BASE_INPUT, { saved: true });

    expect(result).toBe(true);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.to).toEqual(["ceo@fobee.co.kr"]);
    expect(body.reply_to).toBe("test@example.com");
  });

  it("네트워크 오류가 나도 throw 하지 않고 false를 반환한다", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.LEAD_NOTIFY_TO = "ceo@fobee.co.kr";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendLeadNotification(BASE_INPUT, { saved: false })).resolves.toBe(false);
  });
});
