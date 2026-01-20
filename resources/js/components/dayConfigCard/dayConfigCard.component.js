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
            .dropdown-options {
                max-height: 150px;
                overflow-y: auto;
                padding: 0.5rem;
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
                        <div class="relative">
                            <button type="button" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-background-dark border border-border-dark text-sm font-medium text-white hover:bg-background-dark/80 transition-colors" data-start-time-dropdown="${date}" aria-haspopup="listbox" aria-expanded="false">
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-base text-slate-400">schedule</span>
                                    <span>${startTime}</span>
                                </span>
                                <span class="material-symbols-outlined text-sm text-slate-400">expand_more</span>
                            </button>
                            <div class="absolute top-full left-0 right-0 mt-1 bg-background-dark border border-border-dark rounded-xl shadow-lg z-10 hidden dropdown-options" data-start-time-options="${date}" role="listbox">
                                ${timeOptions.map(time => `
                                    <button type="button" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left ${time === startTime ? 'bg-white/5' : ''}" data-action="select-start-time" data-time="${time}" data-date="${date}" role="option" aria-selected="${time === startTime}">
                                        <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style="background-color: rgba(59, 130, 246, 0.19);">
                                            <span class="material-symbols-outlined text-sm" style="color: rgb(59, 130, 246);">schedule</span>
                                        </div>
                                        <span class="text-white text-sm font-medium whitespace-nowrap">${time}</span>
                                        ${time === startTime ? '<span class="material-symbols-outlined text-xs ml-auto text-slate-400">check</span>' : ''}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] text-slate-500 font-bold uppercase ml-1">End Time</label>
                        <div class="relative">
                            <button type="button" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-background-dark border border-border-dark text-sm font-medium text-white hover:bg-background-dark/80 transition-colors" data-end-time-dropdown="${date}" aria-haspopup="listbox" aria-expanded="false">
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-base text-slate-400">schedule</span>
                                    <span>${endTime}</span>
                                </span>
                                <span class="material-symbols-outlined text-sm text-slate-400">expand_more</span>
                            </button>
                            <div class="absolute top-full left-0 right-0 mt-1 bg-background-dark border border-border-dark rounded-xl shadow-lg z-10 hidden dropdown-options" data-end-time-options="${date}" role="listbox">
                                ${timeOptions.map(time => `
                                    <button type="button" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left ${time === endTime ? 'bg-white/5' : ''}" data-action="select-end-time" data-time="${time}" data-date="${date}" role="option" aria-selected="${time === endTime}">
                                        <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style="background-color: rgba(59, 130, 246, 0.19);">
                                            <span class="material-symbols-outlined text-sm" style="color: rgb(59, 130, 246);">schedule</span>
                                        </div>
                                        <span class="text-white text-sm font-medium whitespace-nowrap">${time}</span>
                                        ${time === endTime ? '<span class="material-symbols-outlined text-xs ml-auto text-slate-400">check</span>' : ''}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
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

    // Dropdown functionality
    const startTimeDropdown = container.querySelector(`[data-start-time-dropdown="${date}"]`);
    const startTimeOptions = container.querySelector(`[data-start-time-options="${date}"]`);
    const endTimeDropdown = container.querySelector(`[data-end-time-dropdown="${date}"]`);
    const endTimeOptions = container.querySelector(`[data-end-time-options="${date}"]`);

    // Toggle dropdown visibility
    function toggleDropdown(dropdown, options) {
        const isExpanded = dropdown.getAttribute('aria-expanded') === 'true';
        dropdown.setAttribute('aria-expanded', !isExpanded);
        options.classList.toggle('hidden');
    }

    // Close dropdown when clicking outside
    function closeDropdown(dropdown, options) {
        dropdown.setAttribute('aria-expanded', 'false');
        options.classList.add('hidden');
    }

    // Event listeners for dropdown toggles
    if (startTimeDropdown && startTimeOptions) {
        startTimeDropdown.addEventListener('click', () => toggleDropdown(startTimeDropdown, startTimeOptions));
    }
    if (endTimeDropdown && endTimeOptions) {
        endTimeDropdown.addEventListener('click', () => toggleDropdown(endTimeDropdown, endTimeOptions));
    }

    // Handle option selection
    container.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const time = button.getAttribute('data-time');
        const dateAttr = button.getAttribute('data-date');

        if (action === 'select-start-time' && dateAttr === date) {
            // Update start time display
            const displaySpan = startTimeDropdown.querySelector('span:last-child');
            if (displaySpan) displaySpan.textContent = time;

            // Update selected state
            startTimeOptions.querySelectorAll('[data-action="select-start-time"]').forEach(btn => {
                btn.classList.remove('bg-white/5');
                btn.querySelector('.ml-auto')?.remove();
                btn.setAttribute('aria-selected', 'false');
            });
            button.classList.add('bg-white/5');
            button.setAttribute('aria-selected', 'true');
            if (!button.querySelector('.ml-auto')) {
                button.insertAdjacentHTML('beforeend', '<span class="material-symbols-outlined text-xs ml-auto text-slate-400">check</span>');
            }

            // Close dropdown
            closeDropdown(startTimeDropdown, startTimeOptions);

            // Trigger change event
            const event = new CustomEvent('startTimeChange', { detail: { date, time } });
            container.dispatchEvent(event);
        } else if (action === 'select-end-time' && dateAttr === date) {
            // Update end time display
            const displaySpan = endTimeDropdown.querySelector('span:last-child');
            if (displaySpan) displaySpan.textContent = time;

            // Update selected state
            endTimeOptions.querySelectorAll('[data-action="select-end-time"]').forEach(btn => {
                btn.classList.remove('bg-white/5');
                btn.querySelector('.ml-auto')?.remove();
                btn.setAttribute('aria-selected', 'false');
            });
            button.classList.add('bg-white/5');
            button.setAttribute('aria-selected', 'true');
            if (!button.querySelector('.ml-auto')) {
                button.insertAdjacentHTML('beforeend', '<span class="material-symbols-outlined text-xs ml-auto text-slate-400">check</span>');
            }

            // Close dropdown
            closeDropdown(endTimeDropdown, endTimeOptions);

            // Trigger change event
            const event = new CustomEvent('endTimeChange', { detail: { date, time } });
            container.dispatchEvent(event);
        }
    });
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
