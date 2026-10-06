/* CHP-Angola — Gestor de Notificações Push */
(function() {
    'use strict';

    const CONFIG = {
        vapidPublicKey: 'SUBSTITUIR_PELA_TUA_CHAVE_VAPID',
        swPath: './service-worker.js',
        promptDelay: 45000,
        minScrollForPrompt: 800,
        storageKey: 'chp-push-prompt-seen'
    };

    let registration = null;
    let subscription = null;
    let promptShown = false;

    function createPromptBanner() {
        if (document.getElementById('chp-push-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'chp-push-banner';
        banner.style.cssText = `position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(150px); width: calc(100% - 40px); max-width: 420px; background: linear-gradient(135deg, #0B2545, #13335c); color: white; padding: 18px 20px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.4); border: 1px solid rgba(197, 160, 89, 0.4); z-index: 99998; font-family: 'Inter', sans-serif; transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);`;
        banner.innerHTML = `
            <div style="display:flex; gap:14px; align-items:flex-start;">
                <div style="width:44px; height:44px; flex-shrink:0; background: linear-gradient(135deg, #C5A059, #D4B87A); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #0B2545;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <div style="flex:1;">
                    <strong style="display:block; color:#C5A059; font-size:14px; margin-bottom:6px;">Receber notificações?</strong>
                    <p style="font-size:13px; color:#CBD5E1; line-height:1.5; margin-bottom:12px;">Avisamos-te quando a tua simulação estiver pronta.</p>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button id="chp-push-allow" style="flex:1; min-width:120px; padding: 10px 18px; background: linear-gradient(135deg, #C5A059, #D4B87A); color: #0B2545; border: none; border-radius: 50px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit;">✓ Ativar</button>
                        <button id="chp-push-deny" style="padding: 10px 18px; background: transparent; color: #94A3B8; border: 1px solid rgba(255,255,255,0.15); border-radius: 50px; font-weight: 600; font-size: 13px; cursor: pointer; font-family: inherit;">Depois</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(banner);
        document.getElementById('chp-push-allow').addEventListener('click', () => { hideBanner(); requestPermission(); });
        document.getElementById('chp-push-deny').addEventListener('click', () => { hideBanner(); localStorage.setItem(CONFIG.storageKey, 'dismissed-' + Date.now()); });
    }

    function showBanner() {
        const banner = document.getElementById('chp-push-banner');
        if (banner) setTimeout(() => banner.style.transform = 'translateX(-50%) translateY(0)', 100);
    }

    function hideBanner() {
        const banner = document.getElementById('chp-push-banner');
        if (banner) { banner.style.transform = 'translateX(-50%) translateY(150px)'; setTimeout(() => banner.remove(), 500); }
    }

    async function requestPermission() {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return subscribeUser();
        if (Notification.permission === 'denied') return false;
        const permission = await Notification.requestPermission();
        return permission === 'granted' ? subscribeUser() : false;
    }

    async function subscribeUser() {
        try {
            registration = await navigator.serviceWorker.ready;
            subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(CONFIG.vapidPublicKey)
                });
            }
            await fetch('/api/save-subscription.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: subscription.toJSON() })
            });
            return true;
        } catch (err) { return false; }
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        return outputArray;
    }

    function shouldShowPrompt() {
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;
        if (Notification.permission !== 'default') return false;
        return true;
    }

    function init() {
        if (!('serviceWorker' in navigator)) return;
        let scrollTriggered = false;
        const maybeShow = () => {
            if (promptShown || !shouldShowPrompt()) return;
            promptShown = true;
            createPromptBanner();
            setTimeout(showBanner, 500);
        };
        window.addEventListener('scroll', () => {
            if (!scrollTriggered && window.scrollY > CONFIG.minScrollForPrompt) {
                scrollTriggered = true;
                setTimeout(maybeShow, 3000);
            }
        }, { passive: true });
        setTimeout(maybeShow, CONFIG.promptDelay);
    }

    window.CHPPush = {
        subscribe: requestPermission,
        isSubscribed: () => !!subscription,
        sendTest: async () => {
            if (registration) {
                await registration.showNotification('CHP-Angola — Teste', {
                    body: 'Notificação de teste. Tudo a funcionar! ✓',
                    icon: './icons/icon-192.png',
                    vibrate: [200, 100, 200]
                });
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }
})();
