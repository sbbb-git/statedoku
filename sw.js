// Statedoku — minimal service worker
// Handles notification clicks and basic offline-friendly behavior.

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const open = clients.find((c) => c.url.includes('/'));
      if (open) return open.focus();
      return self.clients.openWindow('/');
    })
  );
});
