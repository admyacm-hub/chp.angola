/**
 * CHP-ANGOLA — Service Worker
 * Versão: 1.1.0 (compatível com GitHub Pages em subpasta)
 */

const VERSION = '1.1.0';
const CACHE_STATIC = `chp-static-v${VERSION}`;
const CACHE_RUNTIME = `chp-runtime-v${VERSION}`;
const CACHE_IMAGES = `chp-images-v${VERSION}`;

const PRECACHE_URLS = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    './privacidade.html',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&display=swap'
];

const MAX_RUNTIME_ENTRIES = 60;
const MAX_IMAGE_ENTRIES = 40;

self.addEventListener('install', (event) => {
    console.log('[SW] Instalando v' + VERSION);
    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => null))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Ativando v' + VERSION);
    const CURRENT = [CACHE_STATIC, CACHE_RUNTIME, CACHE_IMAGES];
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter(k => !CURRENT.includes(k)).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') return;
    if (url.hostname.includes('googletagmanager.com')) return;
    if (url.hostname.includes('google-analytics.com')) return;
    if (url.hostname.includes('facebook.com')) return;
    if (url.hostname.includes('formspree.io')) return;

    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirstHTML(request));
        return;
    }

    if (request.destination === 'image' || /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)) {
        event.respondWith(cacheFirstImage(request));
        return;
    }

    if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(cacheFirstStatic(request));
        return;
    }

    event.respondWith(cacheFirstStatic(request));
});

async function networkFirstHTML(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_RUNTIME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        const offline = await caches.match('./offline.html');
        if (offline) return offline;
        return new Response('Sem ligação', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
}

async function cacheFirstStatic(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_STATIC);
            cache.put(request, response.clone());
            trimCache(CACHE_STATIC, MAX_RUNTIME_ENTRIES);
        }
        return response;
    } catch (err) {
        return new Response('', { status: 408 });
    }
}

async function cacheFirstImage(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_IMAGES);
            cache.put(request, response.clone());
            trimCache(CACHE_IMAGES, MAX_IMAGE_ENTRIES);
        }
        return response;
    } catch (err) {
        return new Response('', { status: 200, headers: { 'Content-Type': 'image/gif' } });
    }
}

async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        await cache.delete(keys[0]);
        trimCache(cacheName, maxItems);
    }
}

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
    if (event.data?.type === 'CLEAR_CACHE') {
        caches.keys().then((keys) => keys.forEach(k => caches.delete(k)));
    }
});

console.log(`[SW] CHP-Angola v${VERSION} carregado`);
