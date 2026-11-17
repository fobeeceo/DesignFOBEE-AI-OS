import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createPosSession, verifyPosSession, posGateFor, POS_SESSION_MAX_AGE_SEC } from "./posAuth";

describe("POS session cookie", () => {
  const saved = { ...process.env };
  beforeEach(() => { process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY = "server-secret"; process.env.GBRICK_POS_PIN = "4321"; });
  afterEach(() => { process.env = { ...saved }; });

  it("accepts a session it issued, until it expires", async () => {
    const now = Date.UTC(2026, 10, 17);
    const session = await createPosSession(now);
    expect(await verifyPosSession(session, now)).toBe(true);
    expect(await verifyPosSession(session, now + POS_SESSION_MAX_AGE_SEC * 1000 - 1)).toBe(true);
    expect(await verifyPosSession(session, now + POS_SESSION_MAX_AGE_SEC * 1000)).toBe(false);
  });

  it("rejects missing, malformed and tampered values", async () => {
    const session = await createPosSession();
    const [expiresAt, signature] = session.split(".");
    expect(await verifyPosSession(undefined)).toBe(false);
    expect(await verifyPosSession("")).toBe(false);
    expect(await verifyPosSession("1")).toBe(false);
    expect(await verifyPosSession(`${Number(expiresAt) + 1000}.${signature}`)).toBe(false); // 기한만 늘린 위조
    expect(await verifyPosSession(`${expiresAt}.${"0".repeat(64)}`)).toBe(false);
  });

  it("stops accepting old sessions when the PIN or the server secret changes", async () => {
    const session = await createPosSession();
    process.env.GBRICK_POS_PIN = "9999";
    expect(await verifyPosSession(session)).toBe(false);
    process.env.GBRICK_POS_PIN = "4321";
    expect(await verifyPosSession(session)).toBe(true);
    process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY = "another-secret";
    expect(await verifyPosSession(session)).toBe(false);
  });
});

describe("posGateFor", () => {
  it("requires the PIN for every change made from the owner app", () => {
    for (const [method, path] of [
      ["PATCH", "/api/gbrick/admin/menus/menu-001"], ["DELETE", "/api/gbrick/admin/menus/menu-001"], ["POST", "/api/gbrick/admin/menus"],
      ["PATCH", "/api/gbrick/admin/menus/menu-001/options"], ["POST", "/api/gbrick/admin/menus/menu-001/options"], ["DELETE", "/api/gbrick/admin/menus/menu-001/options"],
      ["PATCH", "/api/gbrick/admin/categories"], ["POST", "/api/gbrick/admin/categories"], ["DELETE", "/api/gbrick/admin/categories"],
      ["POST", "/api/gbrick/admin/default-options"], ["PATCH", "/api/gbrick/admin/stores/store-001"], ["POST", "/api/gbrick/admin/upload"],
      ["GET", "/api/gbrick/admin/setup-store"], ["GET", "/api/gbrick/admin/setup-store/"],
    ]) expect(posGateFor(method, path), `${method} ${path}`).toBe("pin");
  });

  it("lets a logged-in store dashboard change order status too", () => {
    expect(posGateFor("PATCH", "/api/gbrick/orders/abc123/status")).toBe("pin-or-login");
  });

  it("leaves everything the customer app uses open", () => {
    for (const [method, path] of [
      ["GET", "/api/gbrick/admin/stores/store-001"],   // 고객 메뉴 화면이 매장 이름을 읽는다
      ["GET", "/api/gbrick/menus"], ["GET", "/api/gbrick/stores"],
      ["POST", "/api/gbrick/orders"], ["GET", "/api/gbrick/orders/abc123"], ["POST", "/api/gbrick/orders/abc123/push"],
      ["GET", "/api/gbrick/push/key"], ["GET", "/gbrick/stores/store-001/menu"],
      ["POST", "/api/gbrick/admin/pin"], ["GET", "/api/gbrick/admin/pin"], ["POST", "/api/gbrick/admin/geocode"],
      ["GET", "/api/gbrick/cron/close-day"],
    ]) expect(posGateFor(method, path), `${method} ${path}`).toBe("none");
  });
});
