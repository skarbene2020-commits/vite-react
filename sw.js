
const CACHE_NAME = 'madzo-delivery-v2';

// لا نقوم بتعريف مصفوفة ملفات ثابتة لتجنب الـ 404 إذا اختلف مسار أي ملف
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // استراتيجية: حاول تجيب من النت، إذا فشل جيب من الكاش
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (event.request.method === 'GET') {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
