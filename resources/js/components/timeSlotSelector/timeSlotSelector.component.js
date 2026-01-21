/**
 * TIME SLOT SELECTOR COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza lista time slots selezionabili
 * - Gestisce stati: available, selected, full
 * 
 * PROPS:
 * - timeSlots: Array<{id, timeLabel, slotsLeft, available}>
 * - selectedTimeSlotId: number|null
 * 
 * CALLBACKS:
 * - onSelect: (slotId) => void
 * 
 * SOLO per CREATE mode (in MODIFY non viene renderizzato)
 */

import { safeInnerHTML, listen } from '../../utils/dom.js';

// Traccia listener
let cleanupListener = null;

/**
 * Renderizza singolo time slot.
 * 
 * @param {Object} slot - { id, timeLabel, slotsLeft, available }
 * @param {boolean} isSelected - Se lo slot è selezionato
 * @returns {string} HTML
 */
function renderTimeSlotItem(slot, isSelected) {
    const { id, timeLabel, slotsLeft, available } = slot;

    // Display time without seconds (e.g. "11:15:00" -> "11:15")
    const displayTimeLabel = typeof timeLabel === 'string'
        ? timeLabel.replace(/:\d{2}$/, '')
        : timeLabel;

    // Classi base
    let containerClasses = 'min-w-32 p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all';
    let timeClasses = 'text-base font-bold';
    let slotsClasses = 'text-[10px] font-bold uppercase tracking-wider';

    if (!available) {
        // FULL
        containerClasses += ' bg-surface-dark border-border-dark opacity-50 cursor-not-allowed';
        timeClasses += ' text-slate-500';
        slotsClasses += ' text-rose-500';
        
        return `
            <div 
                class="${containerClasses}"
                data-slot-id="${id}"
                aria-disabled="true"
                aria-label="${displayTimeLabel}, fully booked"
            >
                <span class="${timeClasses}">${displayTimeLabel}</span>
                <span class="${slotsClasses}">FULL</span>
            </div>
        `;
    }

    if (isSelected) {
        // SELEZIONATO
        containerClasses += ' bg-primary/20 border-primary cursor-pointer shadow-lg shadow-primary/20';
        timeClasses += ' text-primary';
        slotsClasses += ' text-primary';
        
        return `
            <div 
                class="${containerClasses}"
                data-slot-id="${id}"
                data-action="select-slot"
                role="button"
                tabindex="0"
                aria-pressed="true"
                aria-label="${displayTimeLabel}, ${slotsLeft} slots left, selected"
            >
                <span class="${timeClasses}">${displayTimeLabel}</span>
                <span class="${slotsClasses}">${slotsLeft} LEFT</span>
                <span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1">
                    check_circle
                </span>
            </div>
        `;
    }

    // DISPONIBILE NON SELEZIONATO
    const slotsColor = slotsLeft <= 2 ? 'text-amber-500' : 'text-emerald-500';
    containerClasses += ' bg-surface-dark border-border-dark cursor-pointer hover:border-primary/50 active:scale-95';
    timeClasses += ' text-white';
    slotsClasses += ` ${slotsColor}`;
    
    return `
        <div 
            class="${containerClasses}"
            data-slot-id="${id}"
            data-action="select-slot"
            role="button"
            tabindex="0"
            aria-pressed="false"
            aria-label="${displayTimeLabel}, ${slotsLeft} slots left"
        >
            <span class="${timeClasses}">${displayTimeLabel}</span>
            <span class="${slotsClasses}">${slotsLeft} LEFT</span>
        </div>
    `;
}

/**
 * Renderizza lista time slots.
 * 
 * @param {HTMLElement} container - Container DOM
 * @param {Object} props - { timeSlots, selectedTimeSlotId }
 * @param {Object} callbacks - { onSelect }
 */
export function renderTimeSlotSelector(container, props, callbacks) {
    if (!container) return;

    const { timeSlots, selectedTimeSlotId } = props;
    const { onSelect } = callbacks;

    // Se nessun slot disponibile
    if (!timeSlots || timeSlots.length === 0) {
        safeInnerHTML(container, `
            <div class="flex items-center justify-center w-full py-8">
                <p class="text-slate-500 text-sm">No time slots available for this day</p>
            </div>
        `);
        return;
    }

    // Genera HTML
    const slotsHTML = timeSlots.map(slot => {
        const isSelected = slot.id === selectedTimeSlotId;
        return renderTimeSlotItem(slot, isSelected);
    }).join('');

    safeInnerHTML(container, slotsHTML);

    // Cleanup listener precedente
    if (cleanupListener) {
        cleanupListener();
    }

    // Event delegation
    if (onSelect) {
        cleanupListener = listen(container, 'click', (e) => {
            const slotEl = e.target.closest('[data-action="select-slot"]');
            if (slotEl) {
                const slotId = parseInt(slotEl.dataset.slotId, 10);
                onSelect(slotId);
            }
        });
    }

    console.log(`[TimeSlotSelector] Rendered (${timeSlots.length} slots, selected: ${selectedTimeSlotId || 'none'})`);
}

export default { renderTimeSlotSelector };
