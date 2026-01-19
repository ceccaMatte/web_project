/**
 * SERVICE PLANNING VIEW - DOM References
 * 
 * RESPONSABILITÀ:
 * - Centralizza riferimenti DOM per la pagina
 * - Inizializzazione pigra (chiamata da index.js)
 * - NO logica, solo getters
 */

export const servicePlanningView = {
    // Inizializzato?
    _initialized: false,

    // Cache DOM refs
    _refs: {},

    /**
     * Inizializza riferimenti DOM
     */
    init() {
        if (this._initialized) return;

        this._refs = {
            // Page container
            page: document.querySelector('[data-page="service-planning"]'),

            // User state script
            userStateScript: document.querySelector('[data-user-state]'),

            // Config defaults script
            configDefaultsScript: document.querySelector('[data-config-defaults]'),

            // Sidebar
            sidebar: document.querySelector('[data-admin-sidebar]'),
            sidebarBackdrop: document.querySelector('[data-sidebar-backdrop]'),

            // Week selector container
            weekSelectorContainer: document.querySelector('[data-week-selector-container]'),

            // Global constraints container
            globalConstraintsContainer: document.querySelector('[data-global-constraints-container]'),

            // Daily availability container
            dailyAvailabilityContainer: document.querySelector('[data-daily-availability-container]'),

            // Save button
            saveButton: document.querySelector('[data-action="save-changes"]'),
            saveLabel: document.querySelector('[data-save-label]'),
        };

        this._initialized = true;
        console.log('[ServicePlanningView] DOM refs initialized');
    },

    /**
     * Getters for DOM refs
     */
    get page() { return this._refs.page; },
    get userStateScript() { return this._refs.userStateScript; },
    get configDefaultsScript() { return this._refs.configDefaultsScript; },
    get sidebar() { return this._refs.sidebar; },
    get sidebarBackdrop() { return this._refs.sidebarBackdrop; },
    get weekSelectorContainer() { return this._refs.weekSelectorContainer; },
    get globalConstraintsContainer() { return this._refs.globalConstraintsContainer; },
    get dailyAvailabilityContainer() { return this._refs.dailyAvailabilityContainer; },
    get saveButton() { return this._refs.saveButton; },
    get saveLabel() { return this._refs.saveLabel; },
};

export default servicePlanningView;
