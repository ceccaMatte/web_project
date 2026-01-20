/**
 * WEEK SELECTOR COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Mostra intervallo settimana selezionata
 * - Navigazione prev/next settimana
 * - Date picker per navigazione diretta a una data specifica
 * 
 * PROPS:
 * - weekLabel: string (es. "Jan 19 - Jan 25, 2026")
 * - weekStart: string (YYYY-MM-DD)
 * - canGoPrev: boolean
 * - canGoNext: boolean
 * - isLoading: boolean
 * 
 * CALLBACKS:
 * - onPrevWeek: () => void
 * - onNextWeek: () => void
 * - onDateSelect: (dateString) => void
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

    const { 
        weekLabel, 
        weekStart = '',
        canGoPrev = true, 
        canGoNext = true, 
        isLoading = false 
    } = props;
    
    const { onPrevWeek, onNextWeek, onDateSelect } = callbacks;

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
                <span class="material-symbols-outlined text-white" aria-hidden="true">chevron_left</span>
            </button>
            
            <!-- Blocco centrale cliccabile per date picker -->
            <div 
                class="text-center cursor-pointer hover:bg-white/5 px-4 py-1 rounded-lg transition-colors"
                data-action="open-date-picker"
                role="button"
                tabindex="0"
                aria-label="Click to select a different week"
            >
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
                <span class="material-symbols-outlined text-white" aria-hidden="true">chevron_right</span>
            </button>
            
            <!-- Input date nascosto per il date picker nativo -->
            <input 
                type="date"
                data-week-date-picker
                value="${weekStart}"
                class="sr-only"
                aria-hidden="true"
                tabindex="-1"
            >
        </div>
    `;

    // Event listener per il blocco "Current Week"
    const weekBlock = container.querySelector('[data-action="open-date-picker"]');
    const dateInput = container.querySelector('[data-week-date-picker]');

    if (weekBlock && dateInput) {
        // Click sul blocco centrale
        weekBlock.addEventListener('click', () => {
            openDatePicker(dateInput);
        });

        // Supporto tastiera (Enter/Space)
        weekBlock.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDatePicker(dateInput);
            }
        });

        // Quando l'utente seleziona una data
        dateInput.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            console.log('[WeekSelector] Data selezionata:', selectedDate);
            
            if (selectedDate && onDateSelect) {
                onDateSelect(selectedDate);
            }
        });
    }
}

/**
 * Apre il date picker nativo
 * 
 * @param {HTMLInputElement} input - Input element type="date"
 */
function openDatePicker(input) {
    if (!input) return;

    // Prova showPicker() (browser moderni)
    if (typeof input.showPicker === 'function') {
        try {
            input.showPicker();
            console.log('[WeekSelector] showPicker() chiamato');
            return;
        } catch (e) {
            console.log('[WeekSelector] showPicker() fallito, uso fallback');
        }
    }

    // Fallback per browser che non supportano showPicker
    // Rendi temporaneamente visibile l'input per permettere il click
    input.style.position = 'absolute';
    input.style.left = '50%';
    input.style.top = '50%';
    input.style.transform = 'translate(-50%, -50%)';
    input.style.opacity = '0';
    input.style.pointerEvents = 'auto';
    input.classList.remove('sr-only');
    
    input.focus();
    input.click();

    // Nascondi di nuovo dopo un breve delay
    setTimeout(() => {
        input.classList.add('sr-only');
        input.style.position = '';
        input.style.left = '';
        input.style.top = '';
        input.style.transform = '';
        input.style.opacity = '';
        input.style.pointerEvents = '';
    }, 100);
}

export default { renderWeekSelector };
