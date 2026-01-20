/**
 * HOME VIEW - DOM References Layer
 * 
 * RESPONSABILITÀ:
 * - Cachare riferimenti DOM per performance
 * - Fornire mounting points per i componenti
 * - Validare esistenza elementi DOM necessari
 * 
 * ARCHITETTURA:
 * - SOLO riferimenti DOM, NESSUN dato applicativo
 * - Inizializzato una volta al caricamento pagina
 * - Usato da home.render.js per passare container ai componenti
 * 
 * UTILIZZO:
 * import { homeView } from './home.view.js';
 * homeView.init(); // Inizializza refs
 * const container = homeView.refs.topBar; // Ottieni container
 */

import { qs } from '../../utils/dom.js';

/**
 * HOME VIEW OBJECT
 * 
 * Contiene SOLO riferimenti DOM (cached).
 * MAI dati applicativi o logica business.
 */
export const homeView = {
    /**
     * Riferimenti DOM (cached)
     * 
     * Popolati da init(), usati da home.render.js per
     * passare container ai componenti.
     */
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

        // Time Slots
        timeSlotsSection: null,
        timeSlotsContainer: null,
    },

    /**
     * Inizializza tutti i riferimenti DOM
     * 
     * Chiamato una sola volta da home.js al caricamento pagina.
     * Valida esistenza elementi critici e logga warning se mancanti.
     * 
     * IMPORTANTE: Chiamare prima di qualsiasi render.
     */
    init() {
        console.log('[HomeView] Initializing DOM refs...');

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

        // Time Slots
        this.refs.timeSlotsSection = qs('[data-time-slots-section]');
        this.refs.timeSlotsContainer = qs('[data-time-slots-container]');

        // Validazione elementi critici
        this._validateRefs();

        console.log('[HomeView] DOM refs initialized');
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
            'todayServiceSection',
            'schedulerSection',
            'orderPreviewContainer',
            'bookingSlotsContainer',
            'timeSlotsContainer',
        ];

        criticalRefs.forEach(refName => {
            if (!this.refs[refName]) {
                console.warn(`[HomeView] Critical ref missing: ${refName}`);
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
        console.log('[HomeView] DOM refs reset');
    },
};

/**
 * Export default per import aggregato
 */
export default homeView;
