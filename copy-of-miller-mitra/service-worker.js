const CACHE_NAME = 'miller-mitra-cache-v1';
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/index.tsx',
    '/App.tsx',
    '/types.ts',
    '/metadata.json',
    '/services/geminiService.ts',
    '/components/Header.tsx',
    '/components/DashboardPage.tsx',
    '/components/PaddyLiftingPage.tsx',
    '/components/RiceDeliveryPage.tsx',
    '/components/RegisterPage.tsx',
    '/components/ReportsPage.tsx',
    '/components/SettingsPage.tsx',
    '/components/LoginPage.tsx',
    '/components/MillingPage.tsx',
    '/components/FrkManagementPage.tsx',
    '/components/LoadingSpinner.tsx',
    '/components/TurnoutPieChart.tsx',
    '/manifest.json',
    '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Only cache GET requests
            if (event.request.method !== 'GET') {
                return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});