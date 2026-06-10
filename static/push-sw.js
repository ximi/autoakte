// Imported into the generated service worker (workbox importScripts).
// Every push must show a notification — iOS drops the subscription otherwise.
self.addEventListener('push', (event) => {
	let data;
	try {
		data = event.data ? event.data.json() : {};
	} catch {
		data = { body: event.data ? event.data.text() : '' };
	}
	event.waitUntil(
		self.registration.showNotification(data.title || 'Garage', {
			body: data.body || '',
			icon: '/icons/pwa-192.png',
			badge: '/icons/pwa-192.png',
			data: { url: data.url || '/' }
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = (event.notification.data && event.notification.data.url) || '/';
	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
			for (const client of list) {
				if ('focus' in client) return client.focus();
			}
			return clients.openWindow(url);
		})
	);
});
