// DOM references for order form
export const orderFormView = {
    // Cached refs
    refs: {
        // TopBar e Sidebar
        topBar: null,
        sidebar: null,
        overlay: null,
        
        // Header
        header: null,
        
        // Loader e Content
        loader: null,
        content: null,
        
        // Scheduler (solo create)
        schedulerSection: null,
        schedulerContainer: null,
        
        // Time Slots (solo create)
        timeSlotsSection: null,
        timeSlotsContainer: null,
        
        // Selected Ingredients Summary
        summarySection: null,
        summaryContainer: null,
        
        // Selected Ingredients Summary (Desktop)
        summarySectionDesktop: null,
        summaryContainerDesktop: null,
        
        // Ingredients Accordion
        ingredientsSection: null,
        ingredientsContainer: null,
        
        // Footer Actions
        footer: null,
        footerActions: null,
        
        // Footer Actions (Desktop)
        footerActionsDesktop: null,
    },

    // Initialize refs
    init() {
        
        // TopBar e Sidebar
        this.refs.topBar = document.querySelector('[data-topbar]');
        this.refs.sidebar = document.querySelector('[data-sidebar]');
        this.refs.overlay = document.querySelector('[data-sidebar-overlay]');
        
        // Header
        this.refs.header = document.querySelector('[data-header]');
        
        // Loader e Content
        this.refs.loader = document.querySelector('[data-loader]');
        this.refs.content = document.querySelector('[data-content]');
        
        // Scheduler (solo create, potrebbe non esistere)
        this.refs.schedulerSection = document.querySelector('[data-scheduler-section]');
        this.refs.schedulerContainer = document.querySelector('[data-scheduler-container]');
        
        // Time Slots (solo create, potrebbe non esistere)
        this.refs.timeSlotsSection = document.querySelector('[data-timeslots-section]');
        this.refs.timeSlotsContainer = document.querySelector('[data-timeslots-container]');
        
        // Selected Ingredients Summary
        this.refs.summarySection = document.querySelector('[data-summary-section]');
        this.refs.summaryContainer = document.querySelector('[data-summary-container]');
        
        // Selected Ingredients Summary (Desktop)
        this.refs.summarySectionDesktop = document.querySelector('[data-summary-section-desktop]');
        this.refs.summaryContainerDesktop = document.querySelector('[data-summary-container-desktop]');
        
        // Ingredients Accordion
        this.refs.ingredientsSection = document.querySelector('[data-ingredients-section]');
        this.refs.ingredientsContainer = document.querySelector('[data-ingredients-container]');
        
        // Footer Actions
        this.refs.footer = document.querySelector('[data-footer]');
        this.refs.footerActions = document.querySelector('[data-footer-actions]');
        
        // Footer Actions (Desktop)
        this.refs.footerActionsDesktop = document.querySelector('[data-footer-actions-desktop]');
        
        // refs initialized
    },
};

export default orderFormView;
