/* CHP-Angola — Widget de Ações Rápidas */
(function() {
    'use strict';

    const widgetHTML = `
        <div class="qa-widget" id="qaWidget">
            <button class="qa-toggle" id="qaToggle" aria-label="Ações rápidas">
                <svg class="qa-icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                </svg>
                <svg class="qa-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <div class="qa-menu" id="qaMenu">
                <button class="qa-action" data-action="simulador"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg><span>Simular</span></button>
                <button class="qa-action" data-action="whatsapp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg><span>WhatsApp</span></button>
                <button class="qa-action" data-action="call"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>Ligar</span></button>
                <button class="qa-action qa-primary" data-action="top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg><span>Topo</span></button>
            </div>
        </div>
    `;

    const widgetCSS = `
        .qa-widget { position: fixed; bottom: 25px; left: 25px; z-index: 998; display: flex; flex-direction: column-reverse; align-items: center; gap: 12px; font-family: 'Inter', sans-serif; }
        .qa-toggle { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #0B2545, #13335c); border: 2px solid #C5A059; color: #C5A059; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 30px -8px rgba(11, 37, 69, 0.5); transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); position: relative; }
        .qa-toggle:hover { transform: scale(1.1); }
        .qa-toggle svg { width: 24px; height: 24px; position: absolute; transition: all 0.4s ease; }
        .qa-icon-close { opacity: 0; transform: rotate(-90deg) scale(0.5); }
        .qa-widget.open .qa-icon-open { opacity: 0; transform: rotate(90deg) scale(0.5); }
        .qa-widget.open .qa-icon-close { opacity: 1; transform: rotate(0deg) scale(1); }
        .qa-menu { display: flex; flex-direction: column; gap: 10px; max-height: 0; opacity: 0; overflow: hidden; transition: all 0.4s ease; pointer-events: none; }
        .qa-widget.open .qa-menu { max-height: 500px; opacity: 1; pointer-events: auto; }
        .qa-action { display: flex; align-items: center; gap: 12px; padding: 12px 20px 12px 14px; background: white; border: 1px solid rgba(197, 160, 89, 0.3); border-radius: 50px; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; color: #0B2545; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); transition: all 0.3s ease; white-space: nowrap; transform: translateX(-20px); opacity: 0; }
        .qa-widget.open .qa-action { transform: translateX(0); opacity: 1; }
        .qa-action:hover { background: #0B2545; color: #C5A059; }
        .qa-action svg { width: 18px; height: 18px; flex-shrink: 0; }
        .qa-action.qa-primary { background: linear-gradient(135deg, #C5A059, #D4B87A); color: #0B2545; }
        @media (max-width: 768px) { .qa-widget { bottom: 85px; left: 15px; } .qa-toggle { width: 50px; height: 50px; } .qa-action span { display: none; } .qa-action { padding: 12px; border-radius: 50%; } }
    `;

    function init() {
        const style = document.createElement('style');
        style.textContent = widgetCSS;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.innerHTML = widgetHTML;
        document.body.appendChild(container.firstElementChild);

        const widget = document.getElementById('qaWidget');
        const toggle = document.getElementById('qaToggle');
        toggle.addEventListener('click', () => widget.classList.toggle('open'));

        document.addEventListener('click', (e) => {
            if (!widget.contains(e.target)) widget.classList.remove('open');
        });

        widget.querySelectorAll('.qa-action').forEach(action => {
            action.addEventListener('click', () => {
                const type = action.dataset.action;
                if (type === 'simulador') {
                    const el = document.getElementById('simulador');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else if (type === 'whatsapp') {
                    window.open('https://wa.me/244929202707?text=Ol%C3%A1%2C%20vim%20atrav%C3%A9s%20do%20site%20CHP-Angola.', '_blank');
                } else if (type === 'call') {
                    window.location.href = 'tel:+244929202707';
                } else if (type === 'top') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                widget.classList.remove('open');
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }
})();
