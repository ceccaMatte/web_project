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

    const { monthLabel, weekDays, showLabel = true } = props;
    const { onDaySelected } = callbacks;

    // Header - solo se showLabel è true
    const headerHTML = showLabel ? `
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                ${labels.scheduler.title}
            </h2>
            <span class="text-primary text-[10px] font-bold uppercase tracking-widest">
                ${monthLabel || ''}
            </span>
        </div>
    ` : '';

    // Days - Layout a cerchi (w-10 h-10) con container unico
    let daysHTML = '<div class="bg-surface-dark border border-border-dark rounded-2xl p-3"><div class="flex justify-between items-center">';

    weekDays.forEach(day => {
        const { id, weekday, dayNumber, isToday, isActive, isDisabled, isSelected } = day;

        let weekdayColor = '';
        let circleClasses = 'w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all';
        let containerOpacity = '';
        let dotHTML = '';

        if (isDisabled) {
            containerOpacity = 'opacity-40';
            weekdayColor = 'text-slate-500';
            circleClasses += ' text-slate-400';
        } else if (isSelected) {
            weekdayColor = 'text-primary';
            circleClasses += ' bg-primary text-white shadow-lg shadow-primary/30';
        } else if (isActive) {
            weekdayColor = 'text-slate-400';
            circleClasses += ' text-slate-300 hover:bg-slate-800 active:scale-95 cursor-pointer';
        } else {
            containerOpacity = 'opacity-40';
            weekdayColor = 'text-slate-500';
            circleClasses += ' text-slate-400';
        }

        // Dot indicator per "today" e "selected"
        if (isToday && !isSelected) {
            dotHTML = '<div class="absolute top-[50px] mt-1 w-1 h-1 rounded-full bg-primary"></div>';
        } else if (isToday && isSelected) {
            dotHTML = '<div class="absolute top-[50px] mt-1 w-1 h-1 rounded-full bg-white"></div>';
        } else if (isSelected && !isToday) {
            // Pallino sotto al giorno selected (non today)
            dotHTML = '<div class="absolute top-[50px] mt-1 w-1 h-1 rounded-full bg-primary"></div>';
        }

        const ariaLabel = a11y.scheduler.day(weekday, dayNumber, isToday, isDisabled);

        if (isDisabled) {
            daysHTML += `
                <div class="relative flex flex-col items-center ${containerOpacity}" aria-disabled="true" aria-label="${ariaLabel}">
                    <span class="text-[10px] font-bold mb-2 ${weekdayColor}">${weekday}</span>
                    <div class="${circleClasses}">${dayNumber}</div>
                    ${dotHTML}
                </div>
            `;
        } else {
            daysHTML += `
                <button
                    type="button"
                    class="relative flex flex-col items-center ${containerOpacity}"
                    data-day-id="${id}"
                    aria-pressed="${isSelected}"
                    aria-label="${ariaLabel}"
                >
                    <span class="text-[10px] font-bold mb-2 ${weekdayColor}">${weekday}</span>
                    <div class="${circleClasses}">${dayNumber}</div>
                    ${dotHTML}
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
