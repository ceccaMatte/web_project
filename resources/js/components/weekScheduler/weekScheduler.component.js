/**
 * WEEK SCHEDULER COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza scheduler settimanale (7 giorni)
 * - Gestisce selezione giorno
 * - Stati: oggi, attivo, disabilitato, selezionato
 * 
 * PROPS:
 * - monthLabel: string
 * - weekDays: Array<{id, weekday, dayNumber, isToday, isActive, isDisabled, isSelected}>
 * 
 * CALLBACKS:
 * - onDaySelected: (dayId) => void
 */

import { labels, a11y } from '../../config/ui.config.js';
import { safeInnerHTML, listen } from '../../utils/dom.js';

// Traccia listener per evitare duplicati
let cleanupListener = null;

export function renderWeekScheduler(container, props, callbacks) {
    if (!container) return;

    const { monthLabel, weekDays } = props;
    const { onDaySelected } = callbacks;

    // Header
    const headerHTML = `
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                ${labels.scheduler.title}
            </h2>
            <span class="text-primary text-[10px] font-bold uppercase tracking-widest">
                ${monthLabel || ''}
            </span>
        </div>
    `;

    // Days
    let daysHTML = '<div class="bg-surface-dark border border-border-dark rounded-2xl p-2"><div class="flex justify-between gap-1">';

    weekDays.forEach(day => {
        const { id, weekday, dayNumber, isToday, isActive, isDisabled, isSelected } = day;

        let baseClasses = 'flex flex-col items-center justify-center flex-1 py-3 rounded-xl transition-all';
        let stateClasses = '';
        let weekdayColor = '';
        let numberColor = '';

        if (isDisabled) {
            stateClasses = 'opacity-30 cursor-not-allowed';
            weekdayColor = 'text-slate-500';
            numberColor = 'text-slate-400';
        } else if (isSelected) {
            stateClasses = 'border border-primary bg-primary/10 shadow-lg shadow-primary/20';
            weekdayColor = 'text-primary';
            numberColor = 'text-white';
        } else if (isActive) {
            stateClasses = 'hover:bg-slate-800 active:scale-95 cursor-pointer';
            weekdayColor = 'text-slate-400';
            numberColor = 'text-slate-300';
        } else {
            stateClasses = 'opacity-30';
            weekdayColor = 'text-slate-500';
            numberColor = 'text-slate-400';
        }

        const allClasses = `${baseClasses} ${stateClasses}`;
        const ariaLabel = a11y.scheduler.day(weekday, dayNumber, isToday, isDisabled);

        if (isDisabled) {
            daysHTML += `
                <div class="${allClasses}" aria-disabled="true" aria-label="${ariaLabel}">
                    <span class="text-[9px] font-medium uppercase mb-1 ${weekdayColor}">${weekday}</span>
                    <span class="text-base font-bold ${numberColor}">${dayNumber}</span>
                    ${isToday ? '<div class="mt-1 size-1 rounded-full bg-slate-700"></div>' : ''}
                </div>
            `;
        } else {
            daysHTML += `
                <button
                    type="button"
                    class="${allClasses}"
                    data-day-id="${id}"
                    aria-pressed="${isSelected}"
                    aria-label="${ariaLabel}"
                >
                    <span class="text-[9px] font-medium uppercase mb-1 ${weekdayColor}">${weekday}</span>
                    <span class="text-base font-bold ${numberColor}">${dayNumber}</span>
                    ${isToday && !isSelected ? '<div class="mt-1 size-1 rounded-full bg-primary"></div>' : ''}
                    ${isToday && isSelected ? '<div class="mt-1 size-1 rounded-full bg-white"></div>' : ''}
                </button>
            `;
        }
    });

    daysHTML += '</div></div>';

    // Mount
    safeInnerHTML(container, headerHTML + daysHTML);

    console.log('[WeekScheduler] HTML mounted, registering event listeners...');
    console.log('[WeekScheduler] onDaySelected callback:', typeof onDaySelected);

    // Rimuovi listener precedente per evitare duplicati
    if (cleanupListener) {
        console.log('[WeekScheduler] Removing previous listener');
        cleanupListener();
    }

    // Event delegation: click sui giorni
    if (onDaySelected) {
        cleanupListener = listen(container, 'click', (e) => {
            console.log('[WeekScheduler] Container clicked, target:', e.target);
            const button = e.target.closest('[data-day-id]');
            console.log('[WeekScheduler] Closest button:', button);
            if (button) {
                const dayId = button.dataset.dayId;
                console.log('[WeekScheduler] Calling onDaySelected with:', dayId);
                onDaySelected(dayId);
            }
        });
        console.log('[WeekScheduler] Event listener registered on container');
    } else {
        console.warn('[WeekScheduler] Cannot register listener - callback missing');
    }

    console.log(`[WeekScheduler] Rendered (${weekDays.length} days)`);
}

export default { renderWeekScheduler };
