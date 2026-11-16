// 주문 상태 알림(웹 푸시) — 서버 전용
import webpush from "web-push";
import {
  findPushSubscriptions, deletePushSubscription, sbStoreRepo,
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

export function getVapidPublicKey(): string | null {
  return process.env.GBRICK_VAPID_PUBLIC_KEY || null;
}

interface PushOrder { id: string; orderNumber: string; storeId: string; }

const BODIES: Record<string, (num: string) => string> = {
  CONFIRMED: num => `주문이 접수되었습니다. 곧 준비를 시작합니다. 주문번호 ${num}`,
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

/** 주문 상태가 바뀌었을 때 그 주문에 등록된 폰으로 알림을 보낸다. 실패해도 주문 처리를 막지 않는다. */
export async function sendOrderStatusPush(order: PushOrder, status: string): Promise<void> {
  try {
    const publicKey = getVapidPublicKey();
    const privateKey = process.env.GBRICK_VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey || !BODIES[status]) return;

    const subscriptions = await findPushSubscriptions(order.id);
    if (subscriptions.length === 0) return;

    const store = await sbStoreRepo.findById(order.storeId).catch(() => null);
    const payload = JSON.stringify(buildOrderPushPayload(status, order, store?.name ?? null));

    await Promise.all(subscriptions.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { vapidDetails: { subject: VAPID_SUBJECT, publicKey, privateKey }, TTL: 1800, urgency: "high" },
        );
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        // 404·410 = 그 폰에서 알림을 끄거나 앱을 지운 경우 → 주소 삭제
        if (code === 404 || code === 410) await deletePushSubscription(sub.endpoint).catch(() => {});
        else console.error("[push] send failed", code ?? err);
      }
    }));
  } catch (err) {
    console.error("[push] sendOrderStatusPush", err);
  }
}
