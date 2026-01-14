<?php

/**
 * Configurazione degli slot temporali.
 * 
 * La durata è una costante di progetto per garantire:
 * - Prevedibilità del sistema
 * - Coerenza tra tutti i working_days
 * - Semplicità nella gestione degli ordini
 */

return [
    /**
     * Durata in minuti di ogni slot temporale.
     * 
     * Valore fisso: 15 minuti
     * Non modificabile a runtime per mantenere coerenza del sistema.
     */
    'duration_minutes' => 15,
];
