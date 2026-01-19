/**
 * SERVICE PLANNING RENDER
 * 
 * RESPONSABILITÀ:
 * - Orchestrazione render componenti
 * - Trasforma state in props per componenti
 * - Chiama componenti con props + callbacks
 */

import { servicePlanningState, getWeekLabel, canSave } from './servicePlanning.state.js';
import { servicePlanningView } from './servicePlanning.view.js';
import { renderWeekSelector } from '../../components/weekSelector/weekSelector.component.js';
import { renderGlobalConstraintsCard } from '../../components/globalConstraintsCard/globalConstraintsCard.component.js';
import { renderDayConfigCard } from '../../components/dayConfigCard/dayConfigCard.component.js';

// Cached callbacks reference
let _callbacks = null;

/**
 * Set callbacks reference (called from index.js)
 */
export function setCallbacks(callbacks) {
    _callbacks = callbacks;
}

/**
 * Render completo della pagina
 */
export function renderServicePlanningPage() {
    console.log('[ServicePlanningRender] Rendering page...');

    renderWeekSelectorComponent();
    renderGlobalConstraintsComponent();
    renderDailyAvailabilityComponent();
    renderSaveButton();

    console.log('[ServicePlanningRender] Page rendered');
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
        canGoPrev: true,
        canGoNext: true,
        isLoading: servicePlanningState.isLoading,
    }, {
        onPrevWeek: callbacks.goToPrevWeek || (() => {}),
        onNextWeek: callbacks.goToNextWeek || (() => {}),
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
}

/**
 * Render save button
 */
export function renderSaveButton() {
    const button = servicePlanningView.saveButton;
    const label = servicePlanningView.saveLabel;
    if (!button || !label) return;

    const state = servicePlanningState;
    const canSaveNow = canSave();

    button.disabled = !canSaveNow;

    if (state.isSaving) {
        label.textContent = 'Saving...';
    } else if (canSaveNow) {
        label.textContent = 'Save Changes';
    } else {
        label.textContent = 'No changes';
    }
}

export default { renderServicePlanningPage, setCallbacks };
