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
import { ORDER_STATUS_CONFIG } from '../../config/orderStatus.config.js';

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

    // Calculate total counts across all slots
    const totalCounts = timeSlots.reduce((acc, slot) => ({
        pending: acc.pending + (slot.counts?.pending || 0),
        confirmed: acc.confirmed + (slot.counts?.confirmed || 0),
        ready: acc.ready + (slot.counts?.ready || 0),
        picked_up: acc.picked_up + (slot.counts?.picked_up || 0),
    }), { pending: 0, confirmed: 0, ready: 0, picked_up: 0 });

    // Build "All" button with same style as time slot cards
    const isAllSelected = selectedSlotId === 'all' || selectedSlotId === null;
    const totalOrders = totalCounts.confirmed + totalCounts.ready + totalCounts.picked_up;

    let allButtonClasses = '';
    let allButtonContent = '';

    if (isAllSelected) {
        // Selected "All" button - same style as selected time slot card
        allButtonClasses = 'relative flex-shrink-0 w-[240px] p-4 rounded-3xl bg-blue-500/20 border border-blue-500/40 ring-2 ring-blue-500/60 shadow-lg shadow-blue-500/20 transition-all';
        allButtonContent = `
            ${totalCounts.pending > 0 ? `
            <div class="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 shadow-sm">
                <span class="material-symbols-outlined text-amber-400 text-[14px] fill-1">${ORDER_STATUS_CONFIG.pending.icon}</span>
                <span class="text-[11px] font-black text-amber-400">${totalCounts.pending}</span>
            </div>
            ` : ''}
            
            <span class="block text-[11px] font-black text-white/80 mb-1 uppercase tracking-wider text-left">All Slots</span>
            
            <div class="flex items-baseline gap-1.5 mb-2">
                <span class="text-3xl font-extrabold text-white tracking-tighter">${totalOrders}</span>
                <span class="text-[10px] font-black text-white/60 uppercase tracking-widest">Orders</span>
            </div>
            
            <div class="flex items-center gap-1.5">
                <div class="flex-1 flex items-center justify-center gap-2 bg-blue-500/30 rounded-xl py-2 border border-blue-400/30">
                    <span class="material-symbols-outlined text-white text-[16px] opacity-80">${ORDER_STATUS_CONFIG.confirmed.icon}</span>
                    <span class="text-[12px] font-black text-white leading-none">${totalCounts.confirmed}</span>
                </div>
                <div class="flex-1 flex items-center justify-center gap-2 bg-emerald-500/30 rounded-xl py-2 border border-emerald-400/30">
                    <span class="material-symbols-outlined text-white text-[16px] opacity-80">${ORDER_STATUS_CONFIG.ready.icon}</span>
                    <span class="text-[12px] font-black text-white leading-none">${totalCounts.ready}</span>
                </div>
                <div class="flex-1 flex items-center justify-center gap-2 bg-slate-500/30 rounded-xl py-2 border border-slate-400/30 ${totalCounts.picked_up === 0 ? 'opacity-50' : ''}">
                    <span class="material-symbols-outlined text-white text-[16px] opacity-80">${ORDER_STATUS_CONFIG.picked_up.icon}</span>
                    <span class="text-[12px] font-black text-white leading-none">${totalCounts.picked_up}</span>
                </div>
            </div>
        `;
    } else {
        // Unselected "All" button - same style as unselected time slot cards
        allButtonClasses = 'relative flex-shrink-0 w-[240px] p-4 rounded-3xl bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition-all';
        allButtonContent = `
            ${totalCounts.pending > 0 ? `
            <div class="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 shadow-sm">
                <span class="material-symbols-outlined text-amber-400 text-[14px] fill-1">${ORDER_STATUS_CONFIG.pending.icon}</span>
                <span class="text-[11px] font-black text-amber-400">${totalCounts.pending}</span>
            </div>
            ` : ''}
            
            <span class="block text-[11px] font-black text-slate-400 mb-1 uppercase tracking-wider text-left">All Slots</span>
            
            <div class="flex items-baseline gap-1.5 mb-3">
                <span class="text-3xl font-extrabold text-slate-300 tracking-tighter">${totalOrders}</span>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orders</span>
            </div>
            
            <div class="flex items-center gap-1.5">
                <div class="flex-1 flex items-center justify-center gap-2 bg-slate-800/50 rounded-xl py-2 border border-slate-700/50">
                    <span class="material-symbols-outlined text-blue-400 text-[16px] opacity-80">${ORDER_STATUS_CONFIG.confirmed.icon}</span>
                    <span class="text-[12px] font-black text-slate-300 leading-none">${totalCounts.confirmed}</span>
                </div>
                <div class="flex-1 flex items-center justify-center gap-2 bg-slate-800/50 rounded-xl py-2 border border-slate-700/50">
                    <span class="material-symbols-outlined text-emerald-400 text-[16px] opacity-80">${ORDER_STATUS_CONFIG.ready.icon}</span>
                    <span class="text-[12px] font-black text-slate-300 leading-none">${totalCounts.ready}</span>
                </div>
                <div class="flex-1 flex items-center justify-center gap-2 bg-slate-800/50 rounded-xl py-2 border border-slate-700/50 ${totalCounts.picked_up === 0 ? 'opacity-50' : ''}">
                    <span class="material-symbols-outlined text-slate-400 text-[16px] opacity-80">${ORDER_STATUS_CONFIG.picked_up.icon}</span>
                    <span class="text-[12px] font-black text-slate-300 leading-none">${totalCounts.picked_up}</span>
                </div>
            </div>
        `;
    }

    const allButton = `
        <button 
            type="button"
            class="${allButtonClasses}"
            data-action="select-time-slot"
            data-slot-id="all"
            aria-pressed="${isAllSelected}"
            aria-label="All time slots, ${totalOrders} orders in pipeline"
        >
            ${allButtonContent}
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
        <div class="flex overflow-x-auto no-scrollbar gap-3 p-1">
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
