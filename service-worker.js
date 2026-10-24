const CACHE_NAME = 'zametochki-v4';
const STATIC_CACHE = 'zametochki-static-v4';
const DYNAMIC_CACHE = 'zametochki-dynamic-v4';
    
const STATIC_ASSETS = [
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
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
                            cacheName !== DYNAMIC_CACHE) {
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
    // Пропускаем запросы к сторонним ресурсам (например, радио)
    if (!event.request.url.startsWith(location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        if (event.request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});