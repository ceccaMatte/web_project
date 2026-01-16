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
        // Placeholder image (può essere sostituito con dato reale se disponibile)
        const locationImageUrl = 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=400&h=400&fit=crop';
        
        html = `
            <div class="relative overflow-hidden rounded-2xl bg-surface-dark border border-border-dark p-5 shadow-xl" aria-label="${ariaLabel}">
                <!-- Header: Status + Location Info + Image -->
                <div class="flex justify-between items-start mb-4">
                    <div class="flex flex-col gap-1">
                        <!-- Status Badge -->
                        <div class="flex items-center gap-2 mb-1">
                            <span class="relative flex h-2 w-2" aria-hidden="true">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span class="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                                ${labels.service.active}
                            </span>
                        </div>
                        <!-- Location Name -->
                        <h2 class="text-white text-lg font-bold">${location}</h2>
                        <!-- Open Hours -->
                        <p class="text-slate-400 text-xs">Open ${startTime} – ${endTime}</p>
                    </div>
                    <!-- Location Image -->
                    <div class="size-20 rounded-xl bg-cover bg-center border border-border-dark" style="background-image: url('${locationImageUrl}');" role="img" aria-label="Location photo"></div>
                </div>

                <!-- Physical Queue Section (separata) -->
                ${queueTime ? `
                    <div class="flex items-center justify-between p-3 rounded-xl border border-border-dark/60 bg-background-dark/40">
                        <div class="flex items-center gap-3">
                            <div class="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                                <span class="material-symbols-outlined text-lg">${icons.person}</span>
                            </div>
                            <div>
                                <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">Physical Queue</p>
                                <p class="text-xs font-medium text-slate-400">Walk-up wait time</p>
                            </div>
                        </div>
                        <div class="text-xl font-bold text-slate-300">${queueTime} min</div>
                    </div>
                ` : ''}
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
