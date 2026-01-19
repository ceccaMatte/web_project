/**
 * WEEK SELECTOR COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Mostra intervallo settimana selezionata
 * - Navigazione prev/next settimana
 * 
 * PROPS:
 * - weekLabel: string (es. "Jan 19 - Jan 25, 2026")
 * - canGoPrev: boolean
 * - canGoNext: boolean
 * - isLoading: boolean
 * 
 * CALLBACKS:
 * - onPrevWeek: () => void
 * - onNextWeek: () => void
 */

/**
 * Render Week Selector component
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} props - Component props
 * @param {Object} callbacks - Event callbacks
 */
export function renderWeekSelector(container, props, callbacks) {
    if (!container) return;

    const { weekLabel, canGoPrev = true, canGoNext = true, isLoading = false } = props;
    const { onPrevWeek, onNextWeek } = callbacks;

    const prevDisabledClass = !canGoPrev ? 'opacity-50 cursor-not-allowed' : 'active:scale-90 transition-transform';
    const nextDisabledClass = !canGoNext ? 'opacity-50 cursor-not-allowed' : 'active:scale-90 transition-transform';

    container.innerHTML = `
        <div class="flex items-center justify-between bg-card-dark border border-border-dark p-2 rounded-2xl">
            <button 
                type="button"
                data-action="prev-week"
                class="p-2 text-slate-300 hover:text-white ${prevDisabledClass}"
                ${!canGoPrev ? 'disabled' : ''}
                aria-label="Go to previous week"
            >
                <span class="material-symbols-outlined text-white">chevron_left</span>
            </button>
            <div class="text-center">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Week</p>
                <p class="text-sm font-semibold text-white ${isLoading ? 'animate-pulse' : ''}">
                    ${isLoading ? 'Loading...' : weekLabel}
                </p>
            </div>
            <button 
                type="button"
                data-action="next-week"
                class="p-2 text-slate-300 hover:text-white ${nextDisabledClass}"
                ${!canGoNext ? 'disabled' : ''}
                aria-label="Go to next week"
            >
                <span class="material-symbols-outlined text-white">chevron_right</span>
            </button>
        </div>
    `;
}

export default { renderWeekSelector };
