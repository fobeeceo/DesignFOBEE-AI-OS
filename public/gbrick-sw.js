// GBRICK Coffee 고객 앱 — 주문 알림(웹 푸시) 수신
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || "GBRICK Coffee", {
      body: data.body || "",
      icon: "/icons/gbrick-192.png",
      badge: "/icons/gbrick-192.png",
      tag: data.tag,
      data: { url: data.url || "/gbrick" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/gbrick";
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.includes(url) && "focus" in client) return client.focus();
    }
    return self.clients.openWindow(url);
  })());
});
