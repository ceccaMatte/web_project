/**
 * ORDERS VIEW - DOM References Layer
 * 
 * RESPONSABILITÀ:
 * - Cachare riferimenti DOM per performance
 * - Fornire mounting points per i componenti
 * - Validare esistenza elementi DOM necessari
 * 
 * ARCHITETTURA:
 * - SOLO riferimenti DOM, NESSUN dato applicativo
 * - Inizializzato una volta al caricamento pagina
 * - Usato da orders.render.js per passare container ai componenti
 * 
 * UTILIZZO:
 * import { ordersView } from './orders.view.js';
 * ordersView.init(); // Inizializza refs
 * const container = ordersView.refs.activeOrdersSection; // Ottieni container
 */

import { qs } from '../../utils/dom.js';

/**
 * ORDERS VIEW OBJECT
 * 
 * Contiene SOLO riferimenti DOM (cached).
 * MAI dati applicativi o logica business.
 */
export const ordersView = {
    /**
     * Riferimenti DOM (cached)
     * 
     * Popolati da init(), usati da orders.render.js per
     * passare container ai componenti.
     */
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

    /**
     * Inizializza tutti i riferimenti DOM
     * 
     * Chiamato una sola volta da orders/index.js al caricamento pagina.
     * Valida esistenza elementi critici e logga warning se mancanti.
     * 
     * IMPORTANTE: Chiamare prima di qualsiasi render.
     */
    init() {
        console.log('[OrdersView] Initializing DOM refs...');

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

        // Validazione elementi critici
        this._validateRefs();

        console.log('[OrdersView] DOM refs initialized');
    },

    /**
     * Valida esistenza elementi DOM critici
     * 
     * Logga warning per elementi mancanti (non bloccante).
     * Aiuta debug durante sviluppo.
     * 
     * @private
     */
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

    /**
     * Reset refs (per cleanup o testing)
     * 
     * Non usato in produzione, utile per test.
     */
    reset() {
        Object.keys(this.refs).forEach(key => {
            this.refs[key] = null;
        });
        console.log('[OrdersView] DOM refs reset');
    },
};

/**
 * Export default per import aggregato
 */
export default ordersView;
