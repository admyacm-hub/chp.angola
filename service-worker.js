/**
 * CHP-ANGOLA — Service Worker
 * Versão: 1.1.0 (compatível com GitHub Pages em subpasta)
 */

const VERSION = '1.1.0';
const CACHE_STATIC = `chp-static-v${VERSION}`;
const CACHE_RUNTIME = `chp-runtime-v${VERSION}`;
const CACHE_IMAGES = `chp-images-v${VERSION}`;
const CACHE_PENDING = `chp-pending-v${VERSION}`;

// ⚠️ CAMINHOS RELATIVOS para funcionar em /chp.angola/
const PRECACHE_URLS = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    './privacidade.html',
    './widgets/quick-actions.js',
    './widgets/calendar-widget.js',
    './widgets/push-manager.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&display=swap'
];
