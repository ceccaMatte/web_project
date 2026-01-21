// Cached DOM refs for Orders page

import { qs } from '../../utils/dom.js';

export const ordersView = {
    refs: {
        // TopBar
        topBar: null,

        // Sidebar
        sidebar: null,
        overlay: null,

        // Header con back button
        header: null,
        backButton: null,

        // Week Scheduler
        schedulerSection: null,

        // Active Orders Section
        activeOrdersSection: null,
        activeOrdersTitle: null,
        activeOrdersContainer: null, // Container per carosello o empty state

        // Recent Orders Section
        recentOrdersSection: null,
        recentOrdersHeader: null,
        favoritesToggle: null,
        recentOrdersList: null,
    },

    init() {

        // TopBar
        this.refs.topBar = qs('[data-top-bar]');

        // Sidebar
        this.refs.sidebar = qs('[data-sidebar]');
        this.refs.overlay = qs('[data-overlay]');

        // Header
        this.refs.header = qs('[data-orders-header]');
        this.refs.backButton = qs('[data-action="go-back"]');

        // Scheduler
        this.refs.schedulerSection = qs('[data-scheduler-section]');

        // Active Orders
        this.refs.activeOrdersSection = qs('[data-active-orders-section]');
        this.refs.activeOrdersTitle = qs('[data-active-orders-title]');
        this.refs.activeOrdersContainer = qs('[data-active-orders-container]');

        // Recent Orders
        this.refs.recentOrdersSection = qs('[data-recent-orders-section]');
        this.refs.recentOrdersHeader = qs('[data-recent-orders-header]');
        this.refs.favoritesToggle = qs('[data-favorites-toggle]');
        this.refs.recentOrdersList = qs('[data-recent-orders-list]');

        this._validateRefs();
    },

    _validateRefs() {
        const criticalRefs = [
            'topBar',
            'sidebar',
            'overlay',
            'schedulerSection',
            'activeOrdersContainer',
            'recentOrdersList',
        ];

        criticalRefs.forEach(refName => {
            if (!this.refs[refName]) {
                console.warn(`[OrdersView] Critical ref missing: ${refName}`);
            }
        });
    },

    reset() {
        Object.keys(this.refs).forEach(key => { this.refs[key] = null; });
    },
};

/**
 * Export default per import aggregato
 */
export default ordersView;
