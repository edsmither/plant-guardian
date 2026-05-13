// Plant Guardian Service Worker
const CACHE = "pg-v1";

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(clients.claim());
});

self.addEventListener("push", e => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { return; }

  const options = {
    body: data.body || "",
    icon: data.icon || "/plant-guardian/icon-192.png",
    badge: data.badge || "/plant-guardian/icon-192.png",
    tag: data.tag || "pg-alert",
    renotify: data.renotify || false,
    requireInteraction: false,
    data: { url: "https://edsmither.github.io/plant-guardian/" },
  };

  e.waitUntil(self.registration.showNotification(data.title || "🌿 Plant Guardian", options));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || "https://edsmither.github.io/plant-guardian/";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const client of list) {
      if (client.url === target && "focus" in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(target);
  }));
});
