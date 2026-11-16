// 주문 상태 알림(웹 푸시) — 서버 전용
import { createECDH, createHmac } from "crypto";
import webpush from "web-push";
import {
  findPushSubscriptions, deletePushSubscription, sbStoreRepo,
  type PushSubscriptionRow,
} from "@/lib/gbrick/repositories/supabase";

const VAPID_SUBJECT = "https://www.fobee.co.kr";

// 구독 주소는 고객 브라우저가 보내 주는 값이라, 알려진 푸시 서비스로만 보낸다 (서버가 임의 주소로 요청하지 않도록)
const PUSH_HOSTS = [
  "fcm.googleapis.com",
  "push.apple.com",
  "push.services.mozilla.com",
  "notify.windows.com",
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return false;
    return PUSH_HOSTS.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

const base64url = (buf: Buffer) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/**
 * 알림 서명 키(VAPID).
 * GBRICK_VAPID_* 환경변수가 있으면 그것을 쓰고, 없으면 서버만 아는 비밀값(서비스 키)에서 계산해 낸다.
 * 그래서 따로 키를 발급·보관하지 않아도 되고, 계산된 개인 키는 서버 밖으로 나가지 않는다.
 * 공개 키(anon)에서는 절대 만들지 않는다 — 누구나 같은 키를 계산할 수 있기 때문이다.
 */
export function getVapidKeys(): { publicKey: string; privateKey: string } | null {
  const publicKey = process.env.GBRICK_VAPID_PUBLIC_KEY;
  const privateKey = process.env.GBRICK_VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) return { publicKey, privateKey };

  const secret = process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null;
  // 해시값이 곡선에서 쓸 수 없는 수일 확률은 사실상 0이지만, 그때는 다음 번호로 다시 만든다
  for (let i = 0; i < 4; i++) {
    const scalar = createHmac("sha256", secret).update(`gbrick-vapid-v1:${i}`).digest();
    try {
      const ecdh = createECDH("prime256v1");
      ecdh.setPrivateKey(scalar);
      return { publicKey: base64url(ecdh.getPublicKey()), privateKey: base64url(scalar) };
    } catch { /* 다음 번호 */ }
  }
  return null;
}

export function getVapidPublicKey(): string | null {
  return getVapidKeys()?.publicKey ?? null;
}

interface PushOrder { id: string; orderNumber: string; storeId: string; }

// PLACED 는 주문 상태가 아니라 "이 폰이 알림에 등록된 순간" 보내는 접수 확인이다
const BODIES: Record<string, (num: string) => string> = {
  PLACED:    num => `주문이 접수되었습니다. 메뉴가 준비되면 알려드릴게요. 주문번호 ${num}`,
  CONFIRMED: num => `매장에서 주문을 확인했습니다. 곧 준비를 시작합니다. 주문번호 ${num}`,
  READY:     num => `주문하신 메뉴가 준비되었습니다. 지금 픽업해 주세요. 주문번호 ${num}`,
  CANCELLED: num => `주문이 취소되었습니다. 매장에 문의해 주세요. 주문번호 ${num}`,
};

/** 알림을 보내는 상태가 아니면 null */
export function buildOrderPushPayload(status: string, order: PushOrder, storeName: string | null) {
  const body = BODIES[status];
  if (!body) return null;
  return {
    title: storeName || "GBRICK Coffee",
    body: body(order.orderNumber.slice(-6).toUpperCase()),
    url: `/gbrick/orders/${order.id}`,
    tag: `order-${order.id}`,
  };
}

async function send(order: PushOrder, status: string, subscriptions: PushSubscriptionRow[]): Promise<void> {
  const keys = getVapidKeys();
  if (!keys || subscriptions.length === 0) return;
  const store = await sbStoreRepo.findById(order.storeId).catch(() => null);
  const payload = JSON.stringify(buildOrderPushPayload(status, order, store?.name ?? null));

  await Promise.all(subscriptions.map(async sub => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { vapidDetails: { subject: VAPID_SUBJECT, ...keys }, TTL: 1800, urgency: "high" },
      );
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      // 404·410 = 그 폰에서 알림을 끄거나 앱을 지운 경우 → 주소 삭제
      if (code === 404 || code === 410) await deletePushSubscription(sub.endpoint).catch(() => {});
      else console.error("[push] send failed", code ?? err);
    }
  }));
}

/** 주문 상태가 바뀌었을 때 그 주문에 등록된 폰으로 알림을 보낸다. 실패해도 주문 처리를 막지 않는다. */
export async function sendOrderStatusPush(order: PushOrder, status: string): Promise<void> {
  try {
    if (!BODIES[status] || !getVapidKeys()) return;
    await send(order, status, await findPushSubscriptions(order.id));
  } catch (err) {
    console.error("[push] sendOrderStatusPush", err);
  }
}

/** 방금 알림에 등록한 폰 한 대에 접수 확인을 보낸다 */
export async function sendOrderPlacedPush(order: PushOrder, subscription: PushSubscriptionRow): Promise<void> {
  try {
    await send(order, "PLACED", [subscription]);
  } catch (err) {
    console.error("[push] sendOrderPlacedPush", err);
  }
}
