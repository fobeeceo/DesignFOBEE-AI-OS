"use client";

import { useEffect, useState } from "react";

type State = "hidden" | "needs-install" | "off" | "on" | "denied" | "failed";

function toBytes(base64url: string): Uint8Array {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

function toBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function registerPhone(orderId: string, publicKey: string): Promise<void> {
  await navigator.serviceWorker.register("/gbrick-sw.js", { scope: "/gbrick/" });
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  // 서버 키가 바뀐 뒤의 옛 구독은 쓸 수 없으므로 새로 만든다
  if (subscription && toBase64Url(subscription.options.applicationServerKey) !== publicKey) {
    await subscription.unsubscribe();
    subscription = null;
  }
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(publicKey) as BufferSource });
  }
  const res = await fetch(`/api/gbrick/orders/${orderId}/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  if (!res.ok) throw new Error("push register failed");
}

const TEXT: Record<Exclude<State, "hidden" | "off">, string> = {
  on: "🔔 메뉴가 준비되면 이 폰으로 알림을 보내드려요.",
  denied: "알림이 꺼져 있어요. 폰 설정에서 이 앱의 알림을 허용하면 준비 알림을 받을 수 있어요.",
  "needs-install": "아이폰은 홈 화면에 추가한 앱에서만 알림을 받을 수 있어요. 공유 버튼 → ‘홈 화면에 추가’ 후 그 아이콘으로 열어 주세요.",
  failed: "알림 등록에 실패했어요. 다시 시도해 주세요.",
};

/** 주문 상태가 바뀔 때 이 폰으로 알림을 받도록 등록하는 카드. 알림 기능이 설정되지 않았으면 아무것도 그리지 않는다. */
export default function OrderPushButton({ orderId }: { orderId: string }) {
  const [state, setState] = useState<State>("hidden");
  const [publicKey, setPublicKey] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/gbrick/push/key").catch(() => null);
      const key: string | null = res?.ok ? (await res.json()).publicKey : null;
      if (!key || cancelled) return;

      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        const standalone = (navigator as { standalone?: boolean }).standalone === true
          || window.matchMedia("(display-mode: standalone)").matches;
        if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !standalone) setState("needs-install");
        return;
      }

      setPublicKey(key);
      if (Notification.permission === "denied") { setState("denied"); return; }
      if (Notification.permission !== "granted") { setState("off"); return; }
      // 이미 허용한 폰은 버튼 없이 이 주문에 바로 등록한다
      try { await registerPhone(orderId, key); if (!cancelled) setState("on"); }
      catch { if (!cancelled) setState("failed"); }
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "denied" : "off"); return; }
      await registerPhone(orderId, publicKey);
      setState("on");
    } catch {
      setState("failed");
    } finally {
      setBusy(false);
    }
  }

  if (state === "hidden") return null;

  const showButton = state === "off" || state === "failed";
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      {state !== "off" && (
        <p style={{ fontSize: 15, lineHeight: 1.5, color: state === "on" ? "#047857" : "#6B5B4B", margin: 0 }}>{TEXT[state]}</p>
      )}
      {showButton && (
        <button onClick={enable} disabled={busy}
          style={{ width: "100%", marginTop: state === "failed" ? 12 : 0, background: "#2C1A0E", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "등록 중..." : state === "failed" ? "다시 시도" : "🔔 준비되면 알림 받기"}
        </button>
      )}
    </div>
  );
}
