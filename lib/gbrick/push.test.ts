import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendNotification = vi.fn();
vi.mock("web-push", () => ({ default: { sendNotification: (...a: unknown[]) => sendNotification(...a) } }));

const findPushSubscriptions = vi.fn();
const deletePushSubscription = vi.fn();
const findStore = vi.fn();
vi.mock("@/lib/gbrick/repositories/supabase", () => ({
  findPushSubscriptions: (...a: unknown[]) => findPushSubscriptions(...a),
  deletePushSubscription: (...a: unknown[]) => deletePushSubscription(...a),
  sbStoreRepo: { findById: (...a: unknown[]) => findStore(...a) },
}));

import { isAllowedPushEndpoint, buildOrderPushPayload, sendOrderStatusPush, sendOrderPlacedPush, getVapidKeys } from "./push";

const order = { id: "o1", orderNumber: "GB20261116DZ6NR", storeId: "store-001" };
const sub = { endpoint: "https://web.push.apple.com/abc", p256dh: "p", auth: "a" };

describe("isAllowedPushEndpoint", () => {
  it("accepts the real push services", () => {
    expect(isAllowedPushEndpoint("https://web.push.apple.com/QK3...")).toBe(true);
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/xyz")).toBe(true);
    expect(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/x")).toBe(true);
  });
  it("rejects anything else, so the server never calls arbitrary addresses", () => {
    expect(isAllowedPushEndpoint("http://fcm.googleapis.com/x")).toBe(false);
    expect(isAllowedPushEndpoint("https://localhost/x")).toBe(false);
    expect(isAllowedPushEndpoint("https://169.254.169.254/latest")).toBe(false);
    expect(isAllowedPushEndpoint("https://evil-push.apple.com.attacker.io/x")).toBe(false);
    expect(isAllowedPushEndpoint("https://notpush.apple.com/x")).toBe(false);
    expect(isAllowedPushEndpoint("not a url")).toBe(false);
  });
});

describe("buildOrderPushPayload", () => {
  it("uses the store name as title and tells the customer to pick up when ready", () => {
    expect(buildOrderPushPayload("READY", order, "GBRICK Coffee 은평뉴타운 본점")).toEqual({
      title: "GBRICK Coffee 은평뉴타운 본점",
      body: "주문하신 메뉴가 준비되었습니다. 지금 픽업해 주세요. 주문번호 6DZ6NR",
      url: "/gbrick/orders/o1",
      tag: "order-o1",
    });
  });
  it("has messages for accepted and cancelled, and none for other statuses", () => {
    expect(buildOrderPushPayload("PLACED", order, null)?.body).toContain("접수되었습니다");
    expect(buildOrderPushPayload("CONFIRMED", order, null)?.body).toContain("확인했습니다");
    expect(buildOrderPushPayload("CONFIRMED", order, null)?.title).toBe("GBRICK Coffee");
    expect(buildOrderPushPayload("CANCELLED", order, null)?.body).toContain("취소되었습니다");
    expect(buildOrderPushPayload("PICKED_UP", order, null)).toBeNull();
    expect(buildOrderPushPayload("PREPARING", order, null)).toBeNull();
  });
});

describe("sendOrderStatusPush", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GBRICK_VAPID_PUBLIC_KEY = "pub";
    process.env.GBRICK_VAPID_PRIVATE_KEY = "priv";
    findStore.mockResolvedValue({ name: "본점" });
    findPushSubscriptions.mockResolvedValue([sub]);
    sendNotification.mockResolvedValue({});
  });
  afterEach(() => {
    delete process.env.GBRICK_VAPID_PUBLIC_KEY;
    delete process.env.GBRICK_VAPID_PRIVATE_KEY;
  });

  it("sends the notification to every phone registered for the order", async () => {
    await sendOrderStatusPush(order, "READY");
    expect(findPushSubscriptions).toHaveBeenCalledWith("o1");
    expect(sendNotification).toHaveBeenCalledTimes(1);
    const [target, payload, options] = sendNotification.mock.calls[0];
    expect(target).toEqual({ endpoint: sub.endpoint, keys: { p256dh: "p", auth: "a" } });
    expect(JSON.parse(payload).title).toBe("본점");
    expect(options.vapidDetails).toMatchObject({ publicKey: "pub", privateKey: "priv" });
  });

  it("does nothing when there is neither a configured key nor a server secret", async () => {
    delete process.env.GBRICK_VAPID_PRIVATE_KEY;
    await sendOrderStatusPush(order, "READY");
    expect(findPushSubscriptions).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("sends the order-received confirmation to the one phone that just registered", async () => {
    await sendOrderPlacedPush(order, sub);
    expect(findPushSubscriptions).not.toHaveBeenCalled();
    expect(sendNotification).toHaveBeenCalledTimes(1);
    expect(JSON.parse(sendNotification.mock.calls[0][1]).body).toContain("주문이 접수되었습니다");
  });

  it("does nothing for statuses that have no message", async () => {
    await sendOrderStatusPush(order, "PICKED_UP");
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("forgets a phone the push service reports as gone", async () => {
    sendNotification.mockRejectedValue({ statusCode: 410 });
    await sendOrderStatusPush(order, "READY");
    expect(deletePushSubscription).toHaveBeenCalledWith(sub.endpoint);
  });

  it("never throws, even if the table is missing or sending fails", async () => {
    findPushSubscriptions.mockRejectedValue(new Error("relation gb_push_subscriptions does not exist"));
    await expect(sendOrderStatusPush(order, "READY")).resolves.toBeUndefined();
    findPushSubscriptions.mockResolvedValue([sub]);
    sendNotification.mockRejectedValue({ statusCode: 500 });
    await expect(sendOrderStatusPush(order, "READY")).resolves.toBeUndefined();
    expect(deletePushSubscription).not.toHaveBeenCalled();
  });
});

describe("getVapidKeys", () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });
  const clear = () => {
    for (const k of ["GBRICK_VAPID_PUBLIC_KEY", "GBRICK_VAPID_PRIVATE_KEY", "GBRICK_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) delete process.env[k];
  };

  it("derives a stable, valid key pair from the server secret", async () => {
    clear();
    process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY = "server-secret-a";
    const first = getVapidKeys()!;
    expect(getVapidKeys()).toEqual(first);
    expect(Buffer.from(first.publicKey, "base64url")).toHaveLength(65);
    expect(Buffer.from(first.privateKey, "base64url")).toHaveLength(32);
    // 공개 키가 그 개인 키의 짝인지 확인
    const { createECDH } = await import("crypto");
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(Buffer.from(first.privateKey, "base64url"));
    expect(ecdh.getPublicKey().toString("base64url")).toBe(first.publicKey);

    process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY = "server-secret-b";
    expect(getVapidKeys()!.privateKey).not.toBe(first.privateKey);
  });

  it("prefers explicitly configured keys", () => {
    clear();
    process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY = "server-secret-a";
    process.env.GBRICK_VAPID_PUBLIC_KEY = "pub";
    process.env.GBRICK_VAPID_PRIVATE_KEY = "priv";
    expect(getVapidKeys()).toEqual({ publicKey: "pub", privateKey: "priv" });
  });

  it("never derives from a public (anon) key — returns null when no secret exists", () => {
    clear();
    process.env.NEXT_PUBLIC_GBRICK_SUPABASE_ANON_KEY = "public-anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    expect(getVapidKeys()).toBeNull();
  });
});
