const CACHE_NAME = 'zametochki-v3';
const STATIC_CACHE = 'zametochki-static-v3';
const DYNAMIC_CACHE = 'zametochki-dynamic-v3';

// Файлы для кеширования при установке
const STATIC_ASSETS = [
    './index.html',
    './style.css',
    './manifest.json',
    './js/app.js',
    './js/modules/types.js',
    './js/modules/storage.js',
    './js/modules/notes.js',
    './js/modules/folders.js',
    './js/modules/ui.js',
    './js/modules/editor.js',
    './js/modules/media.js',
    './js/modules/todos.js',
    './js/modules/reminders.js',
    './js/modules/radio.js',
    './js/modules/theme.js',
    './js/modules/tags.js',
    './js/modules/utils.js'
];

// ====== УСТАНОВКА ======
self.addEventListener('install', (event) => {
    console.log('[SW] Установка...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Кешируем статику...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Установка завершена!');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Ошибка кеширования:', error);
            })
    );
});

// ====== АКТИВАЦИЯ ======
self.addEventListener('activate', (event) => {
    console.log('[SW] Активация...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== CACHE_NAME) {
                            console.log('[SW] Удаляем старый кеш:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Активация завершена!');
                return self.clients.claim();
            })
    );
});

// ====== ПЕРЕХВАТ ЗАПРОСОВ ======
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (url.origin !== location.origin) {
        if (request.mode === 'cors') {
            event.respondWith(fetch(request));
            return;
        }
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    fetch(request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(DYNAMIC_CACHE)
                                    .then((cache) => {
                                        cache.put(request, networkResponse);
                                    });
                            }
                        })
                        .catch(() => {});
                    return cachedResponse;
                }

                return fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(request, responseClone);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        if (request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('./index.html');
                        }
                        return new Response('Офлайн-режим', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// ====== ОБРАБОТКА УВЕДОМЛЕНИЙ ======
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || 'У вас есть напоминание!',
        icon: './assets/icons/icon-192.png',
        badge: './assets/icons/icon-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            {
                action: 'open',
                title: 'Открыть заметку'
            },
            {
                action: 'close',
                title: 'Закрыть'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'ЗаметОчки', options)
    );
});

// ====== ОБРАБОТКА КЛИКА ПО УВЕДОМЛЕНИЮ ======
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((clientList) => {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// ====== ОБРАБОТКА ОШИБОК ======
self.addEventListener('error', (event) => {
    console.error('[SW] Ошибка:', event.message);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Необработанное обещание:', event.reason);
});