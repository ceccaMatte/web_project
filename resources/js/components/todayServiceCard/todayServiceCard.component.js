/**
 * TODAY SERVICE CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza card stato servizio oggi
 * - Varianti: active (con dati) | inactive (coming soon)
 * 
 * PROPS:
 * - status: 'active' | 'inactive'
 * - location, startTime, endTime, queueTime (se active)
 * 
 * CALLBACKS: nessuno (solo visualizzazione)
 */

import { icons, labels, colors, a11y } from '../../config/ui.config.js';
import { safeInnerHTML } from '../../utils/dom.js';

export function renderTodayServiceCard(container, props) {
    if (!container) return;

    const { status, location, startTime, endTime, queueTime } = props;

    let html = '';

    if (status === 'active') {
        const ariaLabel = a11y.service.active(location, startTime, endTime);
        html = `
            <div class="relative overflow-hidden rounded-2xl bg-surface-dark border border-border-dark p-5 shadow-xl" aria-label="${ariaLabel}">
                <header class="flex justify-between items-start mb-4">
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="relative flex h-2 w-2" aria-hidden="true">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${colors.service.active.indicatorRing} opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 ${colors.service.active.indicator}"></span>
                            </span>
                            <p class="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                ${labels.service.active}
                            </p>
                        </div>
                    </div>
                </header>
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-slate-400 text-base">${icons.local_shipping}</span>
                        <span class="text-slate-300 text-sm">${location}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-slate-400 text-base">${icons.schedule}</span>
                        <span class="text-slate-300 text-sm">${startTime} - ${endTime}</span>
                    </div>
                    ${queueTime ? `
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-slate-400 text-base">${icons.info}</span>
                            <span class="text-slate-300 text-sm">${labels.service.queue_time}: ${labels.service.minutes(queueTime)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else {
        const ariaLabel = a11y.service.inactive;
        html = `
            <div class="relative overflow-hidden rounded-2xl bg-surface-dark border border-border-dark p-5 shadow-xl" aria-label="${ariaLabel}">
                <header class="flex justify-between items-start mb-4">
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="relative flex h-2 w-2 ${colors.service.inactive.indicator} rounded-full" aria-hidden="true"></span>
                            <p class="text-slate-500 text-xs font-bold uppercase tracking-wider">
                                ${labels.service.inactive}
                            </p>
                        </div>
                    </div>
                </header>
                <div class="flex flex-col items-center justify-center py-10">
                    <p class="text-slate-400 text-base font-bold mb-2">
                        ${labels.service.coming_soon}
                    </p>
                </div>
            </div>
        `;
    }

    safeInnerHTML(container, html);
    console.log(`[TodayServiceCard] Rendered (${status})`);
}

export default { renderTodayServiceCard };
