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

import { ORDER_STATUS_CONFIG, ORDER_STATUS } from '../../config/orderStatus.config.js';

/**
 * Build HTML for work time slot card
 * 
 * @param {Object} slot - Slot data
 * @returns {string} - HTML string
 */
export function buildWorkTimeSlotCardHTML(slot) {
    const { id, start_time, end_time, counts, isSelected } = slot;

    const timeLabel = `${formatTime(start_time)} - ${formatTime(end_time)}`;
    
    // Calcola totali
    const confirmedCount = counts?.confirmed || 0;
    const readyCount = counts?.ready || 0;
    const pickedUpCount = counts?.picked_up || 0;
    const pendingCount = counts?.pending || 0;
    const totalOrders = confirmedCount + readyCount + pickedUpCount;

    // Layout secondo il design specificato
    if (isSelected) {
        // TIME SLOT SELECTED - design con stile simile alle card ordine selezionate
        return `
            <button 
                type="button"
                class="relative flex-shrink-0 w-[240px] p-4 rounded-3xl bg-blue-500/20 border border-blue-500/40 ring-2 ring-blue-500/60 shadow-lg shadow-blue-500/20 transition-all"
                data-action="select-time-slot"
                data-slot-id="${id}"
                aria-pressed="true"
                aria-label="Time slot ${timeLabel}, ${totalOrders} orders, selected"
            >
                ${pendingCount > 0 ? `
                <div class="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 shadow-sm">
                    <span class="material-symbols-outlined text-amber-400 text-[14px] fill-1">${ORDER_STATUS_CONFIG.pending.icon}</span>
                    <span class="text-[11px] font-black text-amber-400">${pendingCount}</span>
                </div>
                ` : ''}
                
                <span class="block text-[11px] font-black text-white/80 mb-1 uppercase tracking-wider text-left">${timeLabel}</span>
                
                <div class="flex items-baseline gap-1.5 mb-2">
                    <span class="text-3xl font-extrabold text-white tracking-tighter">${totalOrders}</span>
                    <span class="text-[10px] font-black text-white/60 uppercase tracking-widest">Orders</span>
                </div>
                
                <div class="flex items-center gap-1.5">
                    <div class="flex-1 flex items-center justify-center gap-2 bg-blue-500/30 rounded-xl py-2 border border-blue-400/30">
                        <span class="material-symbols-outlined text-white text-[16px] opacity-80">${ORDER_STATUS_CONFIG.confirmed.icon}</span>
                        <span class="text-[12px] font-black text-white leading-none">${confirmedCount}</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center gap-2 bg-emerald-500/30 rounded-xl py-2 border border-emerald-400/30">
                        <span class="material-symbols-outlined text-white text-[16px] opacity-80">${ORDER_STATUS_CONFIG.ready.icon}</span>
                        <span class="text-[12px] font-black text-white leading-none">${readyCount}</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center gap-2 bg-slate-500/30 rounded-xl py-2 border border-slate-400/30 ${pickedUpCount === 0 ? 'opacity-50' : ''}">
                        <span class="material-symbols-outlined text-white text-[16px] opacity-80">${ORDER_STATUS_CONFIG.picked_up.icon}</span>
                        <span class="text-[12px] font-black text-white leading-none">${pickedUpCount}</span>
                    </div>
                </div>
            </button>
        `;
    } else {
        // TIME SLOT UNSELECTED - design semplificato ma stessa struttura base
        return `
            <button 
                type="button"
                class="relative flex-shrink-0 w-[240px] p-4 rounded-3xl bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition-all"
                data-action="select-time-slot"
                data-slot-id="${id}"
                aria-pressed="false"
                aria-label="Time slot ${timeLabel}, ${totalOrders} orders"
            >
                ${pendingCount > 0 ? `
                <div class="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 shadow-sm">
                    <span class="material-symbols-outlined text-amber-400 text-[14px] fill-1">${ORDER_STATUS_CONFIG.pending.icon}</span>
                    <span class="text-[11px] font-black text-amber-400">${pendingCount}</span>
                </div>
                ` : ''}
                
                <span class="block text-[11px] font-black text-slate-400 mb-1 uppercase tracking-wider text-left">${timeLabel}</span>
                
                <div class="flex items-baseline gap-1.5 mb-3">
                    <span class="text-3xl font-extrabold text-slate-300 tracking-tighter">${totalOrders}</span>
                    <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orders</span>
                </div>
                
                <div class="flex items-center gap-1.5">
                    <div class="flex-1 flex items-center justify-center gap-2 bg-slate-800/50 rounded-xl py-2 border border-slate-700/50">
                        <span class="material-symbols-outlined text-blue-400 text-[16px] opacity-80">${ORDER_STATUS_CONFIG.confirmed.icon}</span>
                        <span class="text-[12px] font-black text-slate-300 leading-none">${confirmedCount}</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center gap-2 bg-slate-800/50 rounded-xl py-2 border border-slate-700/50">
                        <span class="material-symbols-outlined text-emerald-400 text-[16px] opacity-80">${ORDER_STATUS_CONFIG.ready.icon}</span>
                        <span class="text-[12px] font-black text-slate-300 leading-none">${readyCount}</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center gap-2 bg-slate-800/50 rounded-xl py-2 border border-slate-700/50 ${pickedUpCount === 0 ? 'opacity-50' : ''}">
                        <span class="material-symbols-outlined text-slate-400 text-[16px] opacity-80">${ORDER_STATUS_CONFIG.picked_up.icon}</span>
                        <span class="text-[12px] font-black text-slate-300 leading-none">${pickedUpCount}</span>
                    </div>
                </div>
            </button>
        `;
    }
}

/**
 * Format time string from HH:mm:ss to HH:mm
 */
function formatTime(time) {
    if (!time) return '--:--';
    return time.substring(0, 5);
}

export default { buildWorkTimeSlotCardHTML };
