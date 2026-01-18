/**
 * WORK TIME SLOT CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza singolo slot temporale per admin work service
 * - Mostra time range + contatori per status (pending, confirmed, ready, picked_up)
 * - Stato selezionato/non selezionato
 * 
 * PROPS:
 * - id: number
 * - start_time: string (HH:mm)
 * - end_time: string (HH:mm)
 * - counts: { pending, confirmed, ready, picked_up }
 * - isSelected: boolean
 * 
 * UTILIZZO:
 * buildWorkTimeSlotCardHTML({ id, start_time, end_time, counts, isSelected })
 */

/**
 * Build HTML for work time slot card
 * 
 * @param {Object} slot - Slot data
 * @returns {string} - HTML string
 */
export function buildWorkTimeSlotCardHTML(slot) {
    const { id, start_time, end_time, counts, isSelected } = slot;

    const timeLabel = `${formatTime(start_time)} - ${formatTime(end_time)}`;
    
    // Calcola totale ordini in pipeline (esclude pending)
    const pipelineTotal = (counts?.confirmed || 0) + (counts?.ready || 0) + (counts?.picked_up || 0);
    const pendingCount = counts?.pending || 0;

    // Classes condizionali per stato selezionato
    const baseClasses = 'flex flex-col gap-2 px-4 py-3 rounded-xl border transition-all cursor-pointer';
    const selectedClasses = 'bg-primary/10 border-primary text-primary';
    const defaultClasses = 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600';
    
    const classes = isSelected 
        ? `${baseClasses} ${selectedClasses}`
        : `${baseClasses} ${defaultClasses}`;

    return `
        <button 
            type="button"
            class="${classes}"
            data-action="select-time-slot"
            data-slot-id="${id}"
            aria-pressed="${isSelected}"
            aria-label="Time slot ${timeLabel}, ${pipelineTotal} orders in pipeline${pendingCount > 0 ? `, ${pendingCount} pending` : ''}"
        >
            <span class="font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-300'}">
                ${timeLabel}
            </span>
            <div class="flex items-center gap-3 text-[10px] uppercase tracking-wider">
                <span class="flex items-center gap-1">
                    <span class="size-2 rounded-full bg-blue-500"></span>
                    ${counts?.confirmed || 0}
                </span>
                <span class="flex items-center gap-1">
                    <span class="size-2 rounded-full bg-emerald-500"></span>
                    ${counts?.ready || 0}
                </span>
                <span class="flex items-center gap-1">
                    <span class="size-2 rounded-full bg-slate-400"></span>
                    ${counts?.picked_up || 0}
                </span>
                ${pendingCount > 0 ? `
                    <span class="flex items-center gap-1 text-amber-500">
                        <span class="size-2 rounded-full bg-amber-500"></span>
                        ${pendingCount}
                    </span>
                ` : ''}
            </div>
        </button>
    `;
}

/**
 * Format time string from HH:mm:ss to HH:mm
 */
function formatTime(time) {
    if (!time) return '--:--';
    return time.substring(0, 5);
}

export default { buildWorkTimeSlotCardHTML };
