// DOM references for admin work service (lazy init)

export const workServiceView = {
    _initialized: false,
    _refs: {},

    init() {
        if (this._initialized) return;

        this._refs = {
            // Page container
            page: document.querySelector('[data-page="admin-work-service"]'),

            // User state script
            userStateScript: document.querySelector('[data-user-state]'),

            // Current time display
            currentTimeEl: document.querySelector('[data-current-time]'),

            // Scheduler section
            schedulerSection: document.querySelector('[data-scheduler-container]'),

            // Time slots section
            timeSlotsSection: document.querySelector('[data-timeslot-selector-container]'),

            // Orders pipeline container
            ordersPipeline: document.querySelector('[data-orders-pipeline]'),

            // Status rows
            confirmedRow: document.querySelector('[data-status-row="confirmed"]'),
            readyRow: document.querySelector('[data-status-row="ready"]'),
            pickedUpRow: document.querySelector('[data-status-row="picked_up"]'),

            // Recap card (desktop sidebar)
            recapCard: document.querySelector('[data-recap-card]'),

            // Recap modal (mobile)
            recapModal: document.querySelector('[data-recap-modal]'),
            recapModalContent: document.querySelector('[data-recap-modal-content]'),
        };

        this._initialized = true;
    },
    // getters
    get page() { return this._refs.page; },
    get userStateScript() { return this._refs.userStateScript; },
    get currentTimeEl() { return this._refs.currentTimeEl; },
    get schedulerSection() { return this._refs.schedulerSection; },
    get timeSlotsSection() { return this._refs.timeSlotsSection; },
    get ordersPipeline() { return this._refs.ordersPipeline; },
    get confirmedRow() { return this._refs.confirmedRow; },
    get readyRow() { return this._refs.readyRow; },
    get pickedUpRow() { return this._refs.pickedUpRow; },
    get recapCard() { return this._refs.recapCard; },
    get recapModal() { return this._refs.recapModal; },
    get recapModalContent() { return this._refs.recapModalContent; },
};

export default workServiceView;
