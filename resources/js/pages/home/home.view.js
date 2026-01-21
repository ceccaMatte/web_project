import { qs } from '../../utils/dom.js';
export const homeView = {
    // Cached DOM references
    refs: {
        // TopBar
        topBar: null,

        // Sidebar
        sidebar: null,
        overlay: null,

        // Today Service Card
        todayServiceSection: null,

        // Week Scheduler
        schedulerSection: null,

        // Orders Preview Card
        orderPreviewSection: null,
        orderPreviewHeader: null,
        orderPreviewContainer: null,
        viewAllButton: null,

        // Booking Slots
        bookingSection: null,
        bookingHeader: null,
        bookingSubtitle: null,
        bookingSlotsContainer: null,
    },

    // Initialize cached DOM refs
    init() {
        // TopBar
        this.refs.topBar = qs('[data-top-bar]');

        // Sidebar
        this.refs.sidebar = qs('[data-sidebar]');
        this.refs.overlay = qs('[data-overlay]');

        // Today Service
        this.refs.todayServiceSection = qs('[data-truck-status-section]');

        // Scheduler
        this.refs.schedulerSection = qs('[data-scheduler-section]');

        // Orders Preview
        this.refs.orderPreviewSection = qs('[data-order-preview-section]');
        this.refs.orderPreviewHeader = qs('[data-order-preview-header]');
        this.refs.orderPreviewContainer = qs('[data-order-preview-container]');
        this.refs.viewAllButton = qs('[data-view-all-button]');

        // Booking Slots
        this.refs.bookingSection = qs('[data-booking-section]');
        this.refs.bookingHeader = qs('[data-booking-header]');
        this.refs.bookingSubtitle = qs('[data-booking-subtitle]');
        this.refs.bookingSlotsContainer = qs('[data-booking-slots-container]');

        // Validazione elementi critici
        this._validateRefs();
    },

    // Warn if critical refs are missing
    _validateRefs() {
        const criticalRefs = [
            'topBar',
            'sidebar',
            'overlay',
            'todayServiceSection',
            'schedulerSection',
            'orderPreviewContainer',
            'bookingSlotsContainer',
        ];

        criticalRefs.forEach(refName => {
            if (!this.refs[refName]) console.warn('Missing home ref:', refName);
        });
    },

    // Reset cached refs (used in tests)
    reset() {
        Object.keys(this.refs).forEach(key => {
            this.refs[key] = null;
        });
    },
};

export default homeView;
