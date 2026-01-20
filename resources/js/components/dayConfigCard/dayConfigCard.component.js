/**
 * DAY CONFIG CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Visualizza configurazione di un singolo giorno
 * - Toggle attivo/inattivo
 * - Selettori orario start/end
 * 
 * PROPS:
 * - date: string (YYYY-MM-DD)
 * - dayOfWeek: number (0=Mon, 6=Sun)
 * - dayName: string (Monday, Tuesday, ...)
 * - dayNameShort: string (Mon, Tue, ...)
 * - dayNumber: number (1-31)
 * - isActive: boolean
 * - startTime: string (HH:MM)
 * - endTime: string (HH:MM)
 * - isEditable: boolean
 * - hasOrders: boolean
 * - ordersCount: number
 * - timeSlotDuration: number
 * 
 * CALLBACKS:
 * - onToggle: () => void
 * - onStartTimeChange: (time) => void
 * - onEndTimeChange: (time) => void
 */

/**
 * Render Day Config Card component
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} props - Component props
 * @param {Object} callbacks - Event callbacks
 */
export function renderDayConfigCard(container, props, callbacks) {
    if (!container) return;

    const { 
        date,
        dayOfWeek,
        dayName,
        dayNameShort,
        dayNumber,
        isActive,
        startTime,
        endTime,
        isEditable,
        hasOrders,
        ordersCount,
        timeSlotDuration = 15
    } = props;

    // Generate time options
    const timeOptions = generateTimeOptions(timeSlotDuration);

    // Status indicator
    const statusColor = isActive ? 'emerald' : 'slate';
    const statusLabel = isActive ? 'Active' : 'Inactive';

    // Card styling based on state
    const cardOpacity = isEditable ? '' : 'opacity-60';
    const badgeColor = isActive ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-700/50 border-slate-600 text-slate-400';

    // Not editable message
    const notEditableHtml = !isEditable ? `
        <div class="mt-3 text-[10px] text-amber-500 flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">info</span>
            <span>Past day - Not modifiable</span>
        </div>
    ` : '';

    // Orders warning
    const ordersWarningHtml = hasOrders && isEditable ? `
        <div class="mt-3 text-[10px] text-amber-500 flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">warning</span>
            <span>${ordersCount} order${ordersCount > 1 ? 's' : ''} will be affected</span>
        </div>
    ` : '';

    container.innerHTML = `
        <style>
            [data-start-time] option, [data-end-time] option {
                background-color: #1e293b;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                transition: background-color 0.2s ease;
            }
            [data-start-time] option:hover, [data-end-time] option:hover {
                background-color: #334155;
            }
            [data-start-time], [data-end-time] {
                appearance: none;
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
                background-position: right 0.5rem center;
                background-repeat: no-repeat;
                background-size: 1.5em 1.5em;
                padding-right: 2.5rem;
            }
        </style>
        <div class="bg-card-dark border border-border-dark rounded-2xl p-4 transition-all ${cardOpacity}">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl ${badgeColor} border flex flex-col items-center justify-center">
                            <span class="text-[9px] font-bold uppercase text-white">${dayNameShort}</span>
                            <span class="text-sm font-bold text-white">${dayNumber}</span>
                    </div>
                    <div>
                        <span class="text-sm font-bold text-white">${dayName}</span>
                        <div class="flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-${statusColor}-500"></span>
                            <span class="text-[10px] text-${statusColor}-500 font-bold uppercase">${statusLabel}</span>
                        </div>
                    </div>
                </div>
                <label class="relative inline-flex items-center ${isEditable ? 'cursor-pointer' : 'cursor-not-allowed'}">
                    <input 
                        type="checkbox" 
                        data-day-toggle="${date}"
                        ${isActive ? 'checked' : ''}
                        ${!isEditable ? 'disabled' : ''}
                        class="sr-only peer "
                        aria-label="Toggle ${dayName} active status"
                    >
                    <div class="toggle-bg w-11 h-6 bg-slate-700 peer-checked:bg-primary rounded-full transition-colors relative peer-disabled:opacity-50">
                        <div class="toggle-dot absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm peer-checked:translate-x-5"></div>
                    </div>
                </label>
            </div>
            
            ${isActive ? `
                <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                        <label class="text-[10px] text-slate-500 font-bold uppercase ml-1">Start Time</label>
                            <label class="text-[10px] text-slate-400 font-bold uppercase ml-1">Start Time</label>
                        <select 
                            data-start-time="${date}"
                            ${!isEditable ? 'disabled' : ''}
                            class="w-full bg-background-dark border border-border-dark rounded-xl text-sm font-medium 
                                focus:ring-primary focus:border-primary px-3 py-2.5 text-white cursor-pointer
                                   disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                            aria-label="Start time for ${dayName}"
                        >
                            ${timeOptions.map(time => `
                                <option value="${time}" ${time === startTime ? 'selected' : ''}>${time}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] text-slate-500 font-bold uppercase ml-1">End Time</label>
                            <label class="text-[10px] text-slate-400 font-bold uppercase ml-1">End Time</label>
                        <select 
                            data-end-time="${date}"
                            ${!isEditable ? 'disabled' : ''}
                            class="w-full bg-background-dark border border-border-dark rounded-xl text-sm font-medium 
                                focus:ring-primary focus:border-primary px-3 py-2.5 text-white cursor-pointer
                                   disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                            aria-label="End time for ${dayName}"
                        >
                            ${timeOptions.map(time => `
                                <option value="${time}" ${time === endTime ? 'selected' : ''}>${time}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            ` : ''}
            
            ${notEditableHtml}
            ${ordersWarningHtml}
        </div>
    `;

    // Fix the toggle dot animation with CSS
    const toggleInput = container.querySelector('[data-day-toggle]');
    const toggleDot = container.querySelector('.toggle-dot');
    if (toggleInput && toggleDot) {
        if (toggleInput.checked) {
            toggleDot.style.transform = 'translateX(20px)';
        } else {
            toggleDot.style.transform = 'translateX(0)';
        }
    }
}

/**
 * Generate time options based on slot duration
 */
function generateTimeOptions(duration) {
    const options = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += duration) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
    return options;
}

export default { renderDayConfigCard };
