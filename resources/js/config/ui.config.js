/**
 * UI CONFIGURATION CENTRALIZZATA
 * 
 * RESPONSABILITÀ:
 * - Fornisce palette colori, icone Material Symbols, labels UI e a11y
 * - Centralizza tutte le stringhe e costanti visive
 * - Evita hard-coded values sparsi nel codebase
 * 
 * ARCHITETTURA:
 * - Importato da tutti i componenti per coerenza UI
 * - Unica fonte di verità per aspetto visivo e testi
 * - Facilita localizzazione futura (i18n)
 * 
 * UTILIZZO:
 * import { colors, icons, labels, a11y } from '@/config/ui.config.js';
 */

/**
 * PALETTE COLORI
 * 
 * Mappatura semantica per stati, varianti e componenti.
 * Usa classi Tailwind per coerenza con design system.
 */
export const colors = {
    // Status ordini
    status: {
        pending: {
            bg: 'bg-amber-500/10',
            text: 'text-amber-400',
            dot: 'bg-amber-400',
        },
        confirmed: {
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            dot: 'bg-blue-400',
        },
        ready: {
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-400',
            dot: 'bg-emerald-400',
        },
        picked_up: {
            bg: 'bg-slate-500/10',
            text: 'text-slate-400',
            dot: 'bg-slate-400',
        },
        rejected: {
            bg: 'bg-red-500/10',
            text: 'text-red-400',
            dot: 'bg-red-400',
        },
    },

    // Service status
    service: {
        active: {
            indicator: 'bg-emerald-500',
            indicatorRing: 'bg-emerald-400',
        },
        inactive: {
            indicator: 'bg-slate-700',
        },
    },

    // Componenti UI
    primary: 'text-primary',
    primaryBg: 'bg-primary',
    surface: 'bg-surface-dark',
    border: 'border-border-dark',
};

/**
 * ICONE MATERIAL SYMBOLS
 * 
 * Nomi delle icone Material Symbols Outlined.
 * Referenziare solo da qui per evitare typo.
 */
export const icons = {
    // Navigation
    menu: 'menu',
    close: 'close',
    chevron_right: 'chevron_right',
    arrow_back: 'arrow_back',
    person: 'person_pin_circle',

    // Actions
    add_circle: 'add_circle',
    login: 'login',
    logout: 'logout',
    edit: 'edit',
    delete: 'delete',

    // Status
    receipt: 'receipt',
    check_circle: 'check_circle',
    schedule: 'schedule',
    local_shipping: 'local_shipping',

    // Info
    info: 'info',
    error: 'error',
    warning: 'warning',
};

/**
 * LABELS UI
 * 
 * Tutte le stringhe visibili all'utente.
 * Organizzate per contesto/componente.
 */
export const labels = {
    // TopBar
    topbar: {
        greeting: (name) => `Ciao, ${name}`,
        menu: 'Menu',
    },

    // Sidebar
    sidebar: {
        title: 'Menu',
        home: 'Home',
        orders: 'I miei ordini',
        login: 'Accedi',
        logout: 'Esci',
    },

    // Today Service Card
    service: {
        active: 'Servizio attivo oggi',
        inactive: 'Servizio non disponibile',
        coming_soon: 'Coming soon',
        location: 'Luogo',
        time: 'Orario',
        queue_time: 'Tempo d\'attesa stimato',
        minutes: (n) => `${n} min`,
    },

    // Week Scheduler
    scheduler: {
        title: 'Schedule',
        weekdays: {
            MON: 'Lun',
            TUE: 'Mar',
            WED: 'Mer',
            THU: 'Gio',
            FRI: 'Ven',
            SAT: 'Sab',
            SUN: 'Dom',
        },
    },

    // Orders Preview Card
    orders: {
        login_cta: 'Accedi per vedere i tuoi ordini',
        no_orders: 'Nessun ordine',
        book_sandwich: 'Prenota un panino',
        view_all: 'Vedi tutti',
        order_id: (id) => `#${id}`,
        orders_count: (n) => `${n} ordini`,
    },

    // Order Status Labels
    orderStatus: {
        pending: 'In attesa',
        confirmed: 'Confermato',
        ready: 'Pronto',
        picked_up: 'Ritirato',
        rejected: 'Annullato',
        ready_at: (time) => `Pronto alle ${time}`,
    },

    // Time Slot Card
    slots: {
        book_cta: 'Prenota',
        slots_left: (n) => `${n} posti disponibili`,
        fully_booked: 'Tutto esaurito',
        waitlist: 'Lista d\'attesa',
        selected: 'Selezionato',
    },

    // Booking Section
    booking: {
        title: 'Prenota per domani',
        subtitle: (date, location) => `${date} • ${location}`,
        no_slots: 'Nessuno slot disponibile',
    },

    // Common
    common: {
        loading: 'Caricamento...',
        error: 'Errore di caricamento',
        retry: 'Riprova',
    },
};

/**
 * ACCESSIBILITY LABELS
 * 
 * Aria-label e screen reader text.
 * Descrizioni complete per navigazione assistiva.
 */
export const a11y = {
    // TopBar
    topbar: {
        openSidebar: 'Apri menu di navigazione',
        closeSidebar: 'Chiudi menu di navigazione',
    },

    // Sidebar
    sidebar: {
        navigation: 'Menu di navigazione principale',
        overlay: 'Sfondo sovrapposto. Clicca per chiudere il menu',
        closeButton: 'Chiudi menu',
    },

    // Today Service
    service: {
        active: (location, start, end) => `Servizio attivo oggi presso ${location} dalle ${start} alle ${end}`,
        inactive: 'Servizio non disponibile oggi',
    },

    // Week Scheduler
    scheduler: {
        day: (weekday, date, isToday, isDisabled) => {
            let label = `${weekday} ${date}`;
            if (isToday) label += ', Oggi';
            if (isDisabled) label += ', Non disponibile';
            return label;
        },
        today: 'Oggi',
    },

    // Orders Preview
    orders: {
        login: 'Accedi per gestire i tuoi ordini',
        empty: 'Nessun ordine attivo. Prenota un panino',
        single: (id, status) => `Ordine ${id}, stato: ${status}`,
        multi: (count, id, status) => `Hai ${count} ordini. Ordine più rilevante: ${id}, stato: ${status}`,
    },

    // Time Slots
    slots: {
        available: (time, slotsLeft) => `Slot alle ${time}, ${slotsLeft} posti disponibili`,
        fullyBooked: (time) => `Slot alle ${time} completamente prenotato`,
        selected: (time) => `Slot alle ${time}, selezionato`,
    },
};

/**
 * SOGLIE E COSTANTI
 * 
 * Valori numerici usati per logica UI.
 */
export const thresholds = {
    lowSlotsThreshold: 4, // Sotto questo numero, mostra warning colore amber
};

/**
 * EXPORT DEFAULT
 * 
 * Oggetto aggregato per import singolo.
 */
export default {
    colors,
    icons,
    labels,
    a11y,
    thresholds,
};
