/* Haamkay push messaging worker (notifications only — no app-shell caching). */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: 'Haamkay', body: event.data ? event.data.text() : '' }; }

  const title = data.title || 'Haamkay Enterprises';
  const options = {
    body: data.body || '',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    image: data.image || undefined,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) { client.navigate(url); return client.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
