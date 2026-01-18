/**
 * WORK TIME SLOT SELECTOR COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza lista orizzontale di time slot cards
 * - Bottone "All" per vedere tutti gli slot
 * - Gestisce selezione singola
 * 
 * PROPS:
 * - timeSlots: Array<{ id, start_time, end_time, counts }>
 * - selectedSlotId: number | 'all' | null
 * 
 * CALLBACKS:
 * - onSlotSelect: (slotId: number | 'all') => void
 * 
 * UTILIZZO:
 * renderWorkTimeSlotSelector(container, { timeSlots, selectedSlotId }, { onSlotSelect })
 */

import { buildWorkTimeSlotCardHTML } from '../workTimeSlotCard/workTimeSlotCard.component.js';
import { listen } from '../../utils/dom.js';

/**
 * Render work time slot selector
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} props - Props
 * @param {Object} callbacks - Callbacks
 */
export function renderWorkTimeSlotSelector(container, props, callbacks) {
    if (!container) {
        console.warn('[WorkTimeSlotSelector] Container is null');
        return;
    }

    const { timeSlots, selectedSlotId } = props;
    const { onSlotSelect } = callbacks || {};

    // Empty state
    if (!timeSlots || timeSlots.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <p class="text-slate-500 text-sm">No time slots available</p>
            </div>
        `;
        return;
    }

    // Build "All" button
    const isAllSelected = selectedSlotId === 'all' || selectedSlotId === null;
    const allButtonClasses = isAllSelected 
        ? 'px-4 py-3 rounded-xl bg-primary/10 border border-primary text-primary font-semibold'
        : 'px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-400 hover:border-slate-600';

    // Calculate total counts across all slots
    const totalCounts = timeSlots.reduce((acc, slot) => ({
        pending: acc.pending + (slot.counts?.pending || 0),
        confirmed: acc.confirmed + (slot.counts?.confirmed || 0),
        ready: acc.ready + (slot.counts?.ready || 0),
        picked_up: acc.picked_up + (slot.counts?.picked_up || 0),
    }), { pending: 0, confirmed: 0, ready: 0, picked_up: 0 });

    const allButton = `
        <button 
            type="button"
            class="${allButtonClasses}"
            data-action="select-time-slot"
            data-slot-id="all"
            aria-pressed="${isAllSelected}"
            aria-label="All time slots, ${totalCounts.confirmed + totalCounts.ready + totalCounts.picked_up} orders in pipeline"
        >
            <span class="block font-semibold text-sm ${isAllSelected ? 'text-white' : 'text-slate-300'}">
                All
            </span>
            <div class="flex items-center gap-3 text-[10px] uppercase tracking-wider mt-2">
                <span class="flex items-center gap-1">
                    <span class="size-2 rounded-full bg-blue-500"></span>
                    ${totalCounts.confirmed}
                </span>
                <span class="flex items-center gap-1">
                    <span class="size-2 rounded-full bg-emerald-500"></span>
                    ${totalCounts.ready}
                </span>
                <span class="flex items-center gap-1">
                    <span class="size-2 rounded-full bg-slate-400"></span>
                    ${totalCounts.picked_up}
                </span>
            </div>
        </button>
    `;

    // Build slot cards
    const slotsHTML = timeSlots.map(slot => 
        buildWorkTimeSlotCardHTML({
            ...slot,
            isSelected: slot.id === selectedSlotId
        })
    ).join('');

    container.innerHTML = `
        <div class="flex overflow-x-auto no-scrollbar gap-3 pb-2">
            ${allButton}
            ${slotsHTML}
        </div>
    `;

    // Event delegation
    if (onSlotSelect) {
        listen(container, 'click', (e) => {
            const button = e.target.closest('[data-action="select-time-slot"]');
            if (button) {
                const slotId = button.dataset.slotId;
                const parsedSlotId = slotId === 'all' ? 'all' : parseInt(slotId, 10);
                
                console.log(`[WorkTimeSlotSelector] 🖱️  CLICK detected on time slot button`);
                console.log(`[WorkTimeSlotSelector] 📋 Slot data:`, {
                    rawSlotId: slotId,
                    parsedSlotId: parsedSlotId,
                    currentlySelected: selectedSlotId,
                    buttonElement: button,
                    timestamp: new Date().toISOString()
                });
                
                const startTime = performance.now();
                console.log(`[WorkTimeSlotSelector] ⚡ Calling onSlotSelect at ${startTime}ms`);
                
                try {
                    onSlotSelect(parsedSlotId);
                    const endTime = performance.now();
                    console.log(`[WorkTimeSlotSelector] ✅ onSlotSelect completed in ${(endTime - startTime).toFixed(2)}ms`);
                } catch (error) {
                    const endTime = performance.now();
                    console.error(`[WorkTimeSlotSelector] ❌ onSlotSelect failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
                }
            }
        });
    }

    console.log(`[WorkTimeSlotSelector] Rendered (${timeSlots.length} slots, selected: ${selectedSlotId})`);
}

export default { renderWorkTimeSlotSelector };
