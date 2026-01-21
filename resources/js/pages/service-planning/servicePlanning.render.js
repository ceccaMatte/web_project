// Render helpers for service planning

import { servicePlanningState, getWeekLabel, canSave } from './servicePlanning.state.js';
import { servicePlanningView } from './servicePlanning.view.js';
import { renderWeekSelector } from '../../components/weekSelector/weekSelector.component.js';
import { renderGlobalConstraintsCard } from '../../components/globalConstraintsCard/globalConstraintsCard.component.js';
import { renderDayConfigCard } from '../../components/dayConfigCard/dayConfigCard.component.js';

const DEBUG = false;

function debugLog() {}

// Cached callbacks reference
let _callbacks = null;

/**
 * Set callbacks reference (called from index.js)
 */
export function setCallbacks(callbacks) {
    _callbacks = callbacks;
    debugLog('setCallbacks', 'Callbacks registrati');
}

/**
 * Render completo della pagina
 */
export function renderServicePlanningPage() {
    debugLog('render', 'Rendering pagina...');

    renderWeekSelectorComponent();
    renderGlobalConstraintsComponent();
    renderDailyAvailabilityComponent();
    renderSaveButton();

    debugLog('render', 'Pagina renderizzata', {
        isDirty: servicePlanningState.isDirty,
        isWeekEditable: servicePlanningState.isWeekEditable,
        canSave: canSave()
    });
}

/**
 * Render week selector
 */
export function renderWeekSelectorComponent() {
    const container = servicePlanningView.weekSelectorContainer;
    if (!container) return;

    const callbacks = _callbacks || {};

    renderWeekSelector(container, {
        weekLabel: getWeekLabel(),
        weekStart: servicePlanningState.weekStart,
        canGoPrev: true,
        canGoNext: true,
        isLoading: servicePlanningState.isLoading,
    }, {
        onPrevWeek: callbacks.goToPrevWeek || (() => {}),
        onNextWeek: callbacks.goToNextWeek || (() => {}),
        onDateSelect: callbacks.goToDate || (() => {}),
    });
}

/**
 * Render global constraints card
 */
export function renderGlobalConstraintsComponent() {
    const container = servicePlanningView.globalConstraintsContainer;
    if (!container) return;

    const callbacks = _callbacks || {};

    renderGlobalConstraintsCard(container, {
        maxOrdersPerSlot: servicePlanningState.globalConstraints.maxOrdersPerSlot,
        maxPendingTime: servicePlanningState.globalConstraints.maxPendingTime,
        location: servicePlanningState.globalConstraints.location,
        isEditable: servicePlanningState.isWeekEditable,
        isLoading: servicePlanningState.isLoading,
        timeSlotDuration: servicePlanningState.configDefaults.timeSlotDuration,
    }, {
        onIncrementMaxOrders: callbacks.incrementMaxOrders || (() => {}),
        onDecrementMaxOrders: callbacks.decrementMaxOrders || (() => {}),
        onIncrementMaxPendingTime: callbacks.incrementMaxPendingTime || (() => {}),
        onDecrementMaxPendingTime: callbacks.decrementMaxPendingTime || (() => {}),
        onLocationChange: callbacks.updateLocation || (() => {}),
    });
}

/**
 * Render daily availability list
 */
export function renderDailyAvailabilityComponent() {
    const container = servicePlanningView.dailyAvailabilityContainer;
    if (!container) return;

    const callbacks = _callbacks || {};

    if (servicePlanningState.isLoading) {
        // Keep skeleton during loading
        debugLog('renderDays', 'Loading, mostrando skeleton');
        return;
    }

    // Clear container
    container.innerHTML = '';

    // Render each day
    servicePlanningState.days.forEach(day => {
        const dayContainer = document.createElement('div');
        
        renderDayConfigCard(dayContainer, {
            date: day.date,
            dayOfWeek: day.dayOfWeek,
            dayName: day.dayName,
            dayNameShort: day.dayNameShort,
            dayNumber: day.dayNumber,
            isActive: day.isActive,
            startTime: day.startTime,
            endTime: day.endTime,
            isEditable: day.isEditable,
            hasOrders: day.hasOrders,
            ordersCount: day.ordersCount,
            timeSlotDuration: servicePlanningState.configDefaults.timeSlotDuration,
        }, {
            onToggle: () => callbacks.toggleDay?.(day.date),
            onStartTimeChange: (time) => callbacks.updateDayStartTime?.(day.date, time),
            onEndTimeChange: (time) => callbacks.updateDayEndTime?.(day.date, time),
        });

        container.appendChild(dayContainer);
    });

    debugLog('renderDays', `Renderizzati ${servicePlanningState.days.length} giorni`);
}

/**
 * Render save button
 * 
 * REGOLE:
 * - ENABLED: isDirty=true AND isWeekEditable=true AND !isSaving
 * - DISABLED: in tutti gli altri casi
 * - Label dinamica in base allo stato
 */
export function renderSaveButton() {
    const button = servicePlanningView.saveButton;
    const label = servicePlanningView.saveLabel;
    if (!button || !label) return;

    const state = servicePlanningState;
    const canSaveNow = canSave();

    // Aggiorna stato disabled del pulsante
    button.disabled = !canSaveNow;

    // Aggiorna classi per stile visivo
    if (canSaveNow) {
        button.classList.remove('bg-slate-800', 'text-slate-500');
        button.classList.add('bg-primary', 'text-white');
    } else {
        button.classList.remove('bg-primary', 'text-white');
        button.classList.add('bg-slate-800', 'text-slate-500');
    }

    // Aggiorna label
    if (state.isSaving) {
        label.textContent = 'Saving...';
    } else if (canSaveNow) {
        label.textContent = 'Save Changes';
    } else if (!state.isWeekEditable) {
        label.textContent = 'Week not editable';
    } else {
        label.textContent = 'No changes';
    }

    debugLog('renderSave', `Button: ${canSaveNow ? 'ENABLED' : 'DISABLED'}, Label: ${label.textContent}`);
}

export default { renderServicePlanningPage, setCallbacks };
