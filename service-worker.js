/**
 * CHP-ANGOLA — Service Worker
 * Versão: 1.2.0
 * 
 * Estratégias:
 *  - Network-first para HTML (sempre atualizado, com fallback offline)
 *  - Cache-first para CSS, JS, imagens, fontes (performance máxima)
 *  - Stale-while-revalidate para API (rápido + atualizado em background)
 *  - Fallback para offline.html quando sem rede
 * 
 * Compatível com GitHub Pages em subpasta (/chp.angola/)
 */

const VERSION = '1.2.0';
const CACHE_STATIC = `chp-static-v${VERSION}`;
const CACHE_RUNTIME = `chp-runtime-v${VERSION}`;
const CACHE_IMAGES = `chp-images-v${VERSION}`;
const CACHE_PENDING = `chp-pending-v${VERSION}`;

// ============ RECURSOS ESSENCIAIS (PRÉ-CACHE) ============
// ⚠️ Caminhos relativos para funcionar em /chp.angola/
const PRECACHE_URLS = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    './privacidade.html',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&display=swap'
];

// Limites de cache
const MAX_RUNTIME_ENTRIES = 60;
const MAX_IMAGE_ENTRIES = 40;

// ============ INSTALL ============
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando versão', VERSION);
    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then((cache) => {
                // Adicionar individualmente para não falhar se um recurso faltar
                return Promise.all(
                    PRECACHE_URLS.map((url) => {
                        return cache.add(url).catch((err) => {
                            console.warn('[SW] Falha ao cachear:', url, err.message);
                        });
                    })
                );
            })
            .then(() => self.skipWaiting())
    );
});

// ============ ACTIVATE ============
self.addEventListener('activate', (event) => {
    console.log('[SW] Ativando versão', VERSION);
    const CURRENT_CACHES = [CACHE_STATIC, CACHE_RUNTIME, CACHE_IMAGES, CACHE_PENDING];
    
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => !CURRENT_CACHES.includes(key))
                    .map((key) => {
                        console.log('[SW] Removendo cache antigo:', key);
                        return caches.delete(key);
                    })
            ))
            .then(() => self.clients.claim())
    );
});

// ============ FETCH ============
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // ============ FILTROS DE EXCLUSÃO ============
    
    // 1. Apenas métodos GET
    if (request.method !== 'GET') return;
    
    // 2. Ignorar extensões de browser
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') return;
    
    // 3. Ignorar analytics (nunca cachear)
    if (url.hostname.includes('googletagmanager.com')) return;
    if (url.hostname.includes('google-analytics.com')) return;
    if (url.hostname.includes('hydro-analytics')) return;
    
    // 4. Ignorar Meta/Facebook
    if (url.hostname.includes('facebook.com')) return;
    if (url.hostname.includes('facebook.net')) return;
    
    // 5. Ignorar Formspree (nunca cachear envios)
    if (url.hostname.includes('formspree.io')) return;
    
    // 6. Ignorar tracking do GitHub Pages
    if (url.pathname.includes('rum')) return;
    if (url.pathname.includes('collect')) return;
    
    // 7. Ignorar o próprio Service Worker
    if (url.pathname.includes('service-worker.js')) return;
    
    // 8. Ignorar CDNs externos que já tratam cache próprio
    if (url.hostname.includes('cdnjs.cloudflare.com')) {
        event.respondWith(cacheFirstStatic(request));
        return;
    }

    // ============ ESTRATÉGIAS ============

    // Navegação (HTML) → Network-first com fallback offline
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirstHTML(request));
        return;
    }

    // Imagens → Cache-first
    if (request.destination === 'image' || /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)) {
        event.respondWith(cacheFirstImage(request));
        return;
    }

    // Fontes Google → Cache-first (raramente mudam)
    if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(cacheFirstStatic(request));
        return;
    }

    // API própria → Stale-while-revalidate
    if (url.pathname.startsWith('/api/') || url.pathname.includes('/api/')) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Restantes (CSS, JS, assets) → Cache-first
    event.respondWith(cacheFirstStatic(request));
});

// ============ ESTRATÉGIA: Network-first para HTML ============
async function networkFirstHTML(request) {
    try {
        const response = await fetch(request);
        
        // Guardar cópia no runtime cache
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_RUNTIME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // Fallback: procurar no cache
        const cached = await caches.match(request);
        if (cached) return cached;
        
        // Fallback final: página offline
        const offline = await caches.match('./offline.html');
        if (offline) return offline;
        
        // Se nada, devolver resposta básica
        return new Response(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sem ligação</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0B2545;color:white;"><h1>Sem ligação</h1><p>Verifique a sua internet e tente novamente.</p><button onclick="location.reload()" style="padding:12px 24px;background:#C5A059;color:#0B2545;border:none;border-radius:50px;font-weight:bold;cursor:pointer;">Tentar novamente</button></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    }
}

// ============ ESTRATÉGIA: Cache-first para estáticos ============
async function cacheFirstStatic(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_STATIC);
            cache.put(request, response.clone());
            // Limitar entradas
            trimCache(CACHE_STATIC, MAX_RUNTIME_ENTRIES);
        }
        return response;
    } catch (err) {
        // Sem cache e sem rede → devolver resposta vazia
        return new Response('', { status: 408, statusText: 'Offline' });
    }
}

// ============ ESTRATÉGIA: Cache-first para imagens ============
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
        // Placeholder 1x1 transparente se falhar
        return new Response(
            new Uint8Array([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59]),
            { status: 200, headers: { 'Content-Type': 'image/gif' } }
        );
    }
}

// ============ ESTRATÉGIA: Stale-while-revalidate ============
async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            if (response && response.status === 200) {
                caches.open(CACHE_RUNTIME).then((c) => {
                    c.put(request, response.clone());
                    trimCache(CACHE_RUNTIME, MAX_RUNTIME_ENTRIES);
                });
            }
            return response;
        })
        .catch(() => null);

    return cached || (await fetchPromise) || new Response(
        JSON.stringify({ error: 'Sem ligação' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
}

// ============ Utilitário: limitar entradas no cache ============
async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        await cache.delete(keys[0]);
        // Recursão para remover múltiplas de uma vez
        trimCache(cacheName, maxItems);
    }
}

// ============ MENSAGENS DO CLIENTE ============
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
});

// ============ PUSH NOTIFICATIONS ============
self.addEventListener('push', (event) => {
    console.log('[SW] Push recebido');
    
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { title: 'CHP-Angola', body: event.data?.text() || 'Nova notificação' };
    }
    
    const title = data.title || 'CHP-Angola';
    const priority = data.priority || 'normal';
    
    const options = {
        body: data.body || 'Nova atualização disponível',
        icon: data.icon || './icons/icon-192.png',
        badge: data.badge || './icons/badge-72.png',
        tag: data.tag || 'chp-' + Date.now(),
        data: { url: data.url || './', ...data.data },
        requireInteraction: priority === 'urgent' || priority === 'high',
        renotify: priority === 'urgent',
    };
    
    // Vibração por prioridade
    if (priority === 'urgent') {
        options.vibrate = [300, 100, 300, 100, 300, 100, 300];
    } else if (priority === 'high') {
        options.vibrate = [200, 100, 200, 100, 200];
    } else {
        options.vibrate = [150, 80, 150];
    }
    
    // Ações para leads urgentes
    if (data.type === 'urgent_lead' && data.leadId) {
        options.actions = [
            { action: 'view', title: '👁 Ver Lead' },
            { action: 'whatsapp', title: '💬 WhatsApp' },
            { action: 'dismiss', title: 'Depois' }
        ];
        options.data.leadId = data.leadId;
        options.data.phone = data.phone;
    }
    
    // Ações para simulações prontas
    if (data.type === 'simulation_ready') {
        options.actions = [
            { action: 'view', title: '📄 Ver Proposta' },
            { action: 'whatsapp', title: '💬 Falar' }
        ];
    }
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ============ CLIQUE NA NOTIFICAÇÃO ============
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;
    notification.close();
    
    if (action === 'dismiss') return;
    
    // WhatsApp
    if (action === 'whatsapp' && notification.data?.phone) {
        const phone = notification.data.phone.replace(/\D/g, '');
        return event.waitUntil(
            clients.openWindow(`https://wa.me/244${phone}`)
        );
    }
    
    const urlToOpen = notification.data?.url || './';
    
    // Ver Lead (admin)
    if (action === 'view' && notification.data?.leadId) {
        return event.waitUntil(
            openOrFocusWindow(`./admin.html?lead=${notification.data.leadId}`)
        );
    }
    
    event.waitUntil(openOrFocusWindow(urlToOpen));
});

async function openOrFocusWindow(url) {
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    
    for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
        }
    }
    
    if (clients.openWindow) {
        return clients.openWindow(url);
    }
}

// ============ FECHO DA NOTIFICAÇÃO ============
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notificação fechada:', event.notification.tag);
});

// ============ PUSH SUBSCRIPTION CHANGE ============
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('[SW] Subscrição expirou, a renovar...');
    event.waitUntil(
        self.registration.pushManager.subscribe(event.oldSubscription.options)
            .then((newSubscription) => {
                return fetch('./api/save-subscription.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription: newSubscription.toJSON() })
                });
            })
            .catch((err) => {
                console.warn('[SW] Falha ao renovar subscrição:', err);
            })
    );
});

// ============ BACKGROUND SYNC ============
self.addEventListener('sync', (event) => {
    if (event.tag === 'chp-lead-sync') {
        event.waitUntil(syncPendingLeads());
    }
});

async function syncPendingLeads() {
    const cache = await caches.open(CACHE_PENDING);
    const requests = await cache.keys();
    
    for (const request of requests) {
        try {
            const response = await fetch(request.clone());
            if (response.ok) {
                await cache.delete(request);
                console.log('[SW] Lead sincronizado');
                
                // Notificar cliente
                const clients = await self.clients.matchAll();
                clients.forEach(client => client.postMessage({
                    type: 'LEAD_SYNCED',
                    url: request.url
                }));
            }
        } catch (err) {
            console.log('[SW] Sync falhou, tentará novamente');
        }
    }
}

// ============ LOG FINAL ============
console.log(`[SW] CHP-Angola v${VERSION} carregado`);
console.log(`[SW] Caches: ${CACHE_STATIC}, ${CACHE_RUNTIME}, ${CACHE_IMAGES}`);
