import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

// Listener para forzar la activación de una nueva versión
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Precache de assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache de la API
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.includes('/system/version'),
  new NetworkFirst({
    cacheName: 'api-cache',
  })
);

// Listener para notificaciones Push
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {
    title: 'Notificación de DY Shigma',
    body: 'Tenés una nueva actualización.',
    icon: '/icons/icon-192x192.png'
  };

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-192x192.png',
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Listener para click en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta, navegar a ella
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
