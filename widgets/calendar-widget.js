/* CHP-Angola — Widget de Agendamento */
(function() {
    'use strict';

    const CONFIG = {
        company: 'CHP-Angola',
        phone: '923529486',
        timezone: 'Africa/Luanda',
        duration: 60,
        workHours: { start: 9, end: 18 }
    };

    const modalCSS = `
        .cal-modal-overlay { position: fixed; inset: 0; background: rgba(6, 21, 41, 0.85); backdrop-filter: blur(8px); z-index: 99999; display: none; align-items: center; justify-content: center; padding: 20px; opacity: 0; transition: opacity 0.3s ease; }
        .cal-modal-overlay.show { display: flex; opacity: 1; }
        .cal-modal { background: white; border-radius: 24px; max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5); border: 1px solid rgba(197, 160, 89, 0.3); }
        .cal-header { background: linear-gradient(135deg, #0B2545, #13335c); color: white; padding: 24px 28px; border-radius: 24px 24px 0 0; position: relative; }
        .cal-header h3 { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 800; margin-bottom: 6px; }
        .cal-header p { font-size: 13px; color: #94A3B8; }
        .cal-close { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .cal-body { padding: 28px; }
        .cal-label { display: block; font-size: 12px; font-weight: 700; color: #0B2545; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; }
        .cal-input { width: 100%; padding: 14px 16px; border: 1.5px solid #E2E8F0; border-radius: 12px; font-size: 15px; background: #F8FAFC; margin-bottom: 18px; font-family: inherit; }
        .cal-input:focus { outline: none; border-color: #C5A059; }
        .cal-time-slots { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
        .cal-time-slot { padding: 10px 8px; border: 1.5px solid #E2E8F0; border-radius: 10px; background: white; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .cal-time-slot:hover, .cal-time-slot.selected { border-color: #C5A059; color: #0B2545; }
        .cal-time-slot.selected { background: linear-gradient(135deg, #C5A059, #D4B87A); }
        .cal-btn { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 20px; border-radius: 50px; border: none; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer; text-decoration: none; margin-bottom: 10px; transition: transform 0.3s ease; }
        .cal-btn-gold { background: linear-gradient(135deg, #C5A059, #D4B87A); color: #0B2545; }
        .cal-btn-primary { background: linear-gradient(135deg, #0B2545, #13335c); color: white; }
        .cal-btn:hover { transform: translateY(-2px); }
        .cal-btn svg { width: 18px; height: 18px; }
    `;

    const modalHTML = `
        <div class="cal-modal-overlay" id="calModalOverlay">
            <div class="cal-modal">
                <div class="cal-header">
                    <button class="cal-close" id="calClose">×</button>
                    <h3>Agendar uma Reunião</h3>
                    <p>Escolha o dia e a hora. Vamos confirmar por WhatsApp.</p>
                </div>
                <div class="cal-body">
                    <label class="cal-label">Data</label>
                    <input type="date" id="calDate" class="cal-input">
                    <label class="cal-label">Hora</label>
                    <div class="cal-time-slots" id="calTimeSlots"></div>
                    <label class="cal-label">Nome (opcional)</label>
                    <input type="text" id="calName" class="cal-input" placeholder="O seu nome">
                    <a class="cal-btn cal-btn-gold" id="calWhatsapp" href="#" target="_blank">Pedir por WhatsApp</a>
                    <button class="cal-btn cal-btn-primary" id="calDownload">Adicionar ao Calendário</button>
                </div>
            </div>
        </div>
    `;

    const state = { date: null, time: null, name: '' };

    function generateTimeSlots() {
        const slots = [];
        for (let h = CONFIG.workHours.start; h < CONFIG.workHours.end; h++) {
            slots.push(`${String(h).padStart(2, '0')}:00`);
            slots.push(`${String(h).padStart(2, '0')}:30`);
        }
        return slots;
    }

    function renderSlots() {
        const container = document.getElementById('calTimeSlots');
        const slots = generateTimeSlots();
        container.innerHTML = slots.map(slot => `
            <button class="cal-time-slot ${state.time === slot ? 'selected' : ''}" data-time="${slot}">${slot}</button>
        `).join('');
        container.querySelectorAll('.cal-time-slot').forEach(btn => {
            btn.addEventListener('click', () => {
                state.time = btn.dataset.time;
                renderSlots();
                updateActions();
            });
        });
    }

    function buildICS() {
        const [hours, minutes] = state.time.split(':').map(Number);
        const start = new Date(state.date + 'T00:00:00');
        start.setHours(hours, minutes, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + CONFIG.duration);
        const pad = (n) => String(n).padStart(2, '0');
        const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
        return ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
            `DTSTAMP:${fmt(new Date())}`,
            `DTSTART;TZID=${CONFIG.timezone}:${fmt(start)}`,
            `DTEND;TZID=${CONFIG.timezone}:${fmt(end)}`,
            `SUMMARY:Reunião com ${CONFIG.company}`,
            `DESCRIPTION:Contacto: ${CONFIG.phone}`,
            'END:VEVENT','END:VCALENDAR'].join('\r\n');
    }

    function downloadICS() {
        const blob = new Blob([buildICS()], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reuniao-chp-angola-${state.date}.ics`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function updateActions() {
        const ready = state.date && state.time;
        const wa = document.getElementById('calWhatsapp');
        const dl = document.getElementById('calDownload');
        if (!ready) { wa.style.opacity = '0.4'; dl.style.opacity = '0.4'; return; }
        wa.style.opacity = '1'; dl.style.opacity = '1';
        const dateObj = new Date(state.date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
        const msg = `Olá! Gostaria de agendar uma reunião com a ${CONFIG.company}.\n\n📅 ${dateStr}\n🕐 ${state.time}${state.name ? '\n👤 ' + state.name : ''}`;
        wa.href = `https://wa.me/244${CONFIG.phone}?text=${encodeURIComponent(msg)}`;
    }

    function open() {
        const overlay = document.getElementById('calModalOverlay');
        state.date = null; state.time = null; state.name = '';
        document.getElementById('calDate').value = '';
        document.getElementById('calName').value = '';
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('calDate').min = tomorrow.toISOString().split('T')[0];
        renderSlots();
        updateActions();
        overlay.classList.add('show');
    }

    function close() {
        document.getElementById('calModalOverlay').classList.remove('show');
    }

    function init() {
        const style = document.createElement('style');
        style.textContent = modalCSS;
        document.head.appendChild(style);
        const container = document.createElement('div');
        container.innerHTML = modalHTML;
        document.body.appendChild(container.firstElementChild);

        document.getElementById('calClose').addEventListener('click', close);
        document.getElementById('calModalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'calModalOverlay') close();
        });
        document.getElementById('calDate').addEventListener('change', (e) => {
            state.date = e.target.value;
            updateActions();
        });
        document.getElementById('calName').addEventListener('input', (e) => {
            state.name = e.target.value;
            updateActions();
        });
        document.getElementById('calDownload').addEventListener('click', () => {
            if (state.date && state.time) downloadICS();
        });
    }

    window.CHPCalendar = { open, close };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }
})();
