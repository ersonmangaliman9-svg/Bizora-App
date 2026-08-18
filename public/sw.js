// Bizora — minimal service worker
//
// This exists for exactly one reason: showing notifications. Most mobile
// browsers (Android Chrome in particular) refuse to run `new Notification()`
// directly from page JS — it throws "Illegal constructor" — and require
// going through a registered service worker's `showNotification()` instead.
// This file has no caching / offline logic; it only needs to be alive so
// `navigator.serviceWorker.ready` resolves and `registration.showNotification()`
// works.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Tapping a notification should bring an already-open Bizora tab to the
// front, or open a new one if none is open.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
