/**
 * ORDER STATUS CONFIGURATION - Single Source of Truth
 * 
 * RESPONSABILITÀ:
 * - Definisce tutti gli stati ordine con label, icon, colori
 * - Fornisce helper per accesso rapido ai meta dati
 * - Centralizza classi Tailwind per coerenza UI
 * 
 * UTILIZZO:
 * import { ORDER_STATUS, ORDER_STATUS_CONFIG, getStatusMeta } from '@/config/orderStatus.config.js';
 */

/**
 * ENUM STATI ORDINE
 * 
 * Usare queste costanti invece di stringhe hardcoded.
 */
export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    READY: 'ready',
    PICKED_UP: 'picked_up',
    REJECTED: 'rejected',
};

/**
 * CONFIGURAZIONE COMPLETA STATI
 * 
 * Per ogni stato:
 * - label: testo visualizzato
 * - icon: nome icona Material Symbols
 * - textClass: classe Tailwind per testo
 * - bgClass: classe Tailwind per background solido
 * - softBgClass: classe Tailwind per background soft/trasparente
 * - borderClass: classe Tailwind per bordo
 * - ringClass: classe Tailwind per ring (selected state)
 * - dotClass: classe Tailwind per dot indicator
 * - nextStatus: stato successivo (per CTA)
 * - actionLabel: label CTA per avanzare stato
 */
export const ORDER_STATUS_CONFIG = {
    [ORDER_STATUS.PENDING]: {
        label: 'Pending',
        icon: 'warning',
        textClass: 'text-amber-400',
        bgClass: 'bg-amber-500',
        softBgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-500/20',
        ringClass: 'ring-amber-500/50',
        dotClass: 'bg-amber-400',
        badgeClass: 'bg-amber-500/20 text-amber-400',
        nextStatus: ORDER_STATUS.CONFIRMED,
        actionLabel: 'Confirm',
    },
    [ORDER_STATUS.CONFIRMED]: {
        label: 'Confirmed',
        icon: 'task_alt',
        textClass: 'text-blue-400',
        bgClass: 'bg-blue-500',
        softBgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-500/20',
        ringClass: 'ring-blue-500/50',
        dotClass: 'bg-blue-400',
        badgeClass: 'bg-blue-500/20 text-blue-400',
        nextStatus: ORDER_STATUS.READY,
        actionLabel: 'Mark Ready',
    },
    [ORDER_STATUS.READY]: {
        label: 'Ready',
        icon: 'verified',
        textClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500',
        softBgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/20',
        ringClass: 'ring-emerald-500/50',
        dotClass: 'bg-emerald-400',
        badgeClass: 'bg-emerald-500/20 text-emerald-400',
        nextStatus: ORDER_STATUS.PICKED_UP,
        actionLabel: 'Mark Picked Up',
    },
    [ORDER_STATUS.PICKED_UP]: {
        label: 'Picked Up',
        icon: 'shopping_bag',
        textClass: 'text-slate-300',
        bgClass: 'bg-slate-500',
        softBgClass: 'bg-slate-500/10',
        borderClass: 'border-slate-500/20',
        ringClass: 'ring-slate-500/50',
        dotClass: 'bg-slate-400',
        badgeClass: 'bg-slate-500/20 text-slate-300',
        nextStatus: null,
        actionLabel: null,
    },
    [ORDER_STATUS.REJECTED]: {
        label: 'Rejected',
        icon: 'cancel',
        textClass: 'text-rose-400',
        bgClass: 'bg-rose-500',
        softBgClass: 'bg-rose-500/10',
        borderClass: 'border-rose-500/20',
        ringClass: 'ring-rose-500/50',
        dotClass: 'bg-rose-400',
        badgeClass: 'bg-rose-500/20 text-rose-400',
        nextStatus: null,
        actionLabel: null,
    },
};

/**
 * Stati visualizzabili nel dropdown (escluso pending e rejected)
 */
export const DROPDOWN_STATUSES = [
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.READY,
    ORDER_STATUS.PICKED_UP,
];

/**
 * Stati per le pipeline rows (escluso pending)
 */
export const PIPELINE_STATUSES = [
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.READY,
    ORDER_STATUS.PICKED_UP,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Ottiene configurazione completa per uno stato
 * 
 * @param {string} status - Stato ordine
 * @returns {Object} - Configurazione stato
 */
export function getStatusMeta(status) {
    return ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG[ORDER_STATUS.PENDING];
}

/**
 * Ottiene classi Tailwind per uno stato
 * 
 * @param {string} status - Stato ordine
 * @returns {Object} - { textClass, bgClass, softBgClass, borderClass, ringClass }
 */
export function getStatusClasses(status) {
    const config = getStatusMeta(status);
    return {
        textClass: config.textClass,
        bgClass: config.bgClass,
        softBgClass: config.softBgClass,
        borderClass: config.borderClass,
        ringClass: config.ringClass,
        badgeClass: config.badgeClass,
        dotClass: config.dotClass,
    };
}

/**
 * Ottiene label per uno stato
 * 
 * @param {string} status - Stato ordine
 * @returns {string} - Label
 */
export function getStatusLabel(status) {
    return getStatusMeta(status).label;
}

/**
 * Ottiene icona per uno stato
 * 
 * @param {string} status - Stato ordine
 * @returns {string} - Nome icona Material Symbols
 */
export function getStatusIcon(status) {
    return getStatusMeta(status).icon;
}

/**
 * Ottiene stato successivo
 * 
 * @param {string} status - Stato corrente
 * @returns {string|null} - Stato successivo o null
 */
export function getNextStatus(status) {
    return getStatusMeta(status).nextStatus;
}

/**
 * Ottiene label azione per avanzare stato
 * 
 * @param {string} status - Stato corrente
 * @returns {string|null} - Label azione o null
 */
export function getActionLabel(status) {
    return getStatusMeta(status).actionLabel;
}

export default {
    ORDER_STATUS,
    ORDER_STATUS_CONFIG,
    DROPDOWN_STATUSES,
    PIPELINE_STATUSES,
    getStatusMeta,
    getStatusClasses,
    getStatusLabel,
    getStatusIcon,
    getNextStatus,
    getActionLabel,
};
